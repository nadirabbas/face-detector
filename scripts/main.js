// urls
const models = chrome.extension.getURL("/models");
const wasm = chrome.extension.getURL("/wasm/");

// load models on init
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri(models),
  faceapi.nets.tinyFaceDetector.loadFromUri(models),
  faceapi.nets.ageGenderNet.loadFromUri(models),
])

window.addEventListener('keydown', ({key, altKey}) => {
  if(key === '`' && altKey) {
    main();
  }
})

// models loaded
async function main() {

  faceapi.tf.setWasmPaths(wasm)
  await faceapi.tf.setBackend('wasm');

  // video input
  const input = document.querySelector("video");
  if (!input) return;

  const detections = await faceapi.detectAllFaces(input, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender()
  
  drawOvervideo(input, detections)

  const animFrame = requestAnimationFrame(main);

  const keydown = ({key, altKey}) => {
    if(key === 's' && altKey) {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('keydown', keydown)
    }
  }

  window.addEventListener('keydown', keydown)
}

function drawOvervideo(input, detections) {

  document.querySelectorAll('.face-detector-overlay').forEach(elem => elem.remove())

  const {left: iL, top: iT} = input.getBoundingClientRect(); 
  detections.forEach(({detection, gender, age}) => {
    if(gender === "female" && age < 40) {
      const {left, top, height, width} = detection.box

      const div = document.createElement('div')

      div.classList.add('face-detector-overlay')

      div.style.position = 'absolute';
      div.style.left = (left + iL) + 'px'
      div.style.top = (top + iT) + 'px'
      div.style.width = width + 'px'
      div.style.height = height + 'px'
      div.style.backgroundColor = 'rgba(255, 255, 255, 0)'
      div.style.backdropFilter = 'blur(30px)'
      div.style.borderRadius = '100%';

      document.body.appendChild(div)
    }
  })
}