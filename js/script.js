const video = document.getElementById('videoInput');
const canvas = document.getElementById('overlayCanvas'); // Get the canvas element
const loadingMessage = document.getElementById('loadingMessage');
const errorMessageDiv = document.getElementById('errorMessage');
let modelsLoaded = false;

// Function to show error messages on the webpage
function showError(message) {
    errorMessageDiv.textContent = 'Error: ' + message;
    errorMessageDiv.style.display = 'block';
    loadingMessage.style.display = 'none'; // Hide loading message on error
}

// Function to load all necessary face-api.js models from CDN
async function loadModels() {
    try {
        // Load models from the CDN. These are small files that face-api.js needs.
        // The path must exactly match where the models are hosted.
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/models');
        // faceRecognitionNet is optional for just detection and landmarks, so we'll omit for simplicity
        
        console.log('Face detection models loaded successfully!');
        loadingMessage.style.display = 'none'; // Hide loading message
        modelsLoaded = true;
        startVideo(); // Start webcam after models are loaded

    } catch (error) {
        console.error('Error loading models:', error);
        showError('Failed to load face detection models. Please check your internet connection or try refreshing.');
    }
}

// Function to start accessing the webcam
function startVideo() {
    if (!modelsLoaded) {
        console.warn("Models not loaded yet, cannot start video.");
        return; // Don't proceed if models aren't ready
    }

    // Request access to the user's webcam
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            // When video starts playing, set up the canvas and start detection
            video.addEventListener('play', () => {
                // Adjust canvas size to match video size
                const displaySize = { width: video.videoWidth, height: video.videoHeight };
                faceapi.matchDimensions(canvas, displaySize);

                // Start detecting faces every 100 milliseconds
                setInterval(async () => {
                    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                                                    .withFaceLandmarks(); // Get 68 face landmarks

                    // Resize detections to match the display size
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);

                    // Clear the canvas before drawing new detections
                    const context = canvas.getContext('2d');
                    context.clearRect(0, 0, canvas.width, canvas.height);

                    // Draw bounding boxes around faces
                    faceapi.draw.drawDetections(canvas, resizedDetections);
                    // Draw the 68 facial landmarks (eyes, nose, mouth, etc.)
                    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

                    // Optional: Log specific landmark positions (for your reference)
                    /*
                    resizedDetections.forEach(detection => {
                        const landmarks = detection.landmarks;
                        console.log("Left Eye:", landmarks.getLeftEye());
                        console.log("Right Eye:", landmarks.getRightEye());
                        console.log("Nose:", landmarks.getNose());
                        console.log("Mouth:", landmarks.getMouth());
                    });
                    */

                }, 100); // Run every 100ms
            });
        })
        .catch(err => {
            console.error('Error accessing webcam:', err);
            showError('Access to webcam denied or failed. Please allow camera access in your browser settings.');
        });
}

// Start loading models when the script runs
loadModels();
