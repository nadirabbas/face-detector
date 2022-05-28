(async () => {
  /* --------------- Initialize extension --------------- */
  const models = chrome.extension.getURL("/models");
  const wasm = chrome.extension.getURL("/wasm/");
  Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(models),
    faceapi.nets.tinyFaceDetector.loadFromUri(models),
    faceapi.nets.ageGenderNet.loadFromUri(models),
  ]).then(setToggleHotkey);

  // Use WASM resources
  faceapi.tf.setWasmPaths(wasm);
  await faceapi.tf.setBackend("wasm");

  /* --------------- Extension state --------------- */
  const initialState = {
    input: null,
    isRunning: null,
    animFrame: null,
  };
  const state = { ...initialState };

  /* --------------- Set badge based on state --------------- */
  const setBadge = () => {
    chrome.runtime.sendMessage({
      type: "SET_BADGE_TEXT",
      text: state.isRunning ? "ON" : "OFF",
      color: state.isRunning ? "#00FF00" : "#FF0000",
    });
  };
  setBadge();

  /* --------------- Remove blocks --------------- */
  const removeBlocks = () => {
    document
      .querySelectorAll(".face-detector-overlay")
      .forEach((elem) => elem.remove());
  };

  /* --------------- Reset state --------------- */
  const reset = () => {
    Object.assign(state, { ...initialState });

    // remove blocks
    removeBlocks();
  };

  /* --------------- Set input --------------- */
  const setInput = (input) => {
    state.input = input;
  };

  /* --------------- Toggle Hotkey --------------- */
  function setToggleHotkey() {
    window.addEventListener("keydown", ({ key, altKey }) => {
      if (key === "`" && altKey) {
        if (!state.isRunning) {
          main();
          state.isRunning = true;
        } else if (animFrame) {
          cancelAnimationFrame(animFrame);
          reset();
        }

        setBadge();
      }
    });
  }

  /* --------------- The MAIN function --------------- */
  async function main() {
    // Set input
    if (!state.input) setInput(document.querySelector("video"));
    if (!state.input) return (animFrame = requestAnimationFrame(main));

    // Detect faces
    const detections = await faceapi
      .detectAllFaces(state.input, new faceapi.TinyFaceDetectorOptions())
      .withAgeAndGender();

    // Draw over detected female face(s)
    drawOvervideo(state.input, detections);

    // Repeat toggled off
    animFrame = requestAnimationFrame(main);
  }

  function drawOvervideo(input, detections) {
    // Remove garbage blocks
    removeBlocks();

    // Get input bounding rect for block positioning
    const { left: iL, top: iT } = input.getBoundingClientRect();

    detections.forEach(({ detection, gender, age }) => {
      if (gender !== "female" || age > 40) return;

      // Get the detection box coords
      const { left, top, height, width } = detection.box;

      const div = document.createElement("div");
      div.classList.add("face-detector-overlay");

      // Style the block
      div.style.position = "absolute";
      div.style.left = left + iL + "px";
      div.style.top = top + iT + "px";
      div.style.width = width + "px";
      div.style.height = height + "px";
      div.style.backgroundColor = "rgba(255, 255, 255, 0)";
      div.style.backdropFilter = "blur(30px)";
      div.style.borderRadius = "100%";

      // Add the block to body
      document.body.appendChild(div);
    });
  }
})();
