var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // This function runs when the app is fully ready on the device
    onDeviceReady: function() {
        console.log('Device is ready!'); // You can see this message in your device's developer console later

        var detectFaceButton = document.getElementById('detectFaceButton');
        var detectedImage = document.getElementById('detectedImage');
        var faceResult = document.getElementById('faceResult');

        // When the button is clicked, open the camera
        detectFaceButton.addEventListener('click', function() {
            // Use the camera plugin to take a picture
            navigator.camera.getPicture(onPhotoDataSuccess, onFail, {
                quality: 50, // Image quality (0-100)
                destinationType: Camera.DestinationType.FILE_URI, // Get image as a file path
                sourceType: Camera.PictureSourceType.CAMERA, // Use the device's camera
                encodingType: Camera.EncodingType.JPEG, // Save as JPEG
                mediaType: Camera.MediaType.PICTURE, // Only allow pictures
                saveToPhotoAlbum: false, // Don't save to the photo album automatically
                correctOrientation: true // Important for correct face detection
            });
        });

        // This function runs if the picture is taken successfully
        function onPhotoDataSuccess(imageURI) {
            console.log("Image taken, URI:", imageURI);
            detectedImage.src = imageURI; // Show the taken picture on the screen

            // Now, send the picture to the face detection plugin
            // 0 is often a 'sourceType' for images from a file URI
            window.face.recFace(0, imageURI, // Call the plugin with image data
                function(result) { // This runs if face detection is successful
                    console.log("Face detection success:", result);
                    faceResult.textContent = JSON.stringify(result, null, 2); // Show results on screen

                    if (result && result.faces && result.faces.length > 0) {
                        result.faces.forEach(function(faceData) {
                            console.log("Detected Face ID:", faceData.id);
                            console.log("Bounding Box (x,y,width,height):", faceData.x, faceData.y, faceData.width, faceData.height);

                            // Get positions of eyes, nose, mouth
                            if (faceData.landmarks) {
                                faceData.landmarks.forEach(function(landmark) {
                                    let landmarkName = '';
                                    // These numbers (0, 4, 5, etc.) represent specific facial parts
                                    switch (landmark.type) {
                                        case 0: landmarkName = 'BOTTOM_MOUTH'; break;
                                        case 4: landmarkName = 'LEFT_EYE'; break;
                                        case 5: landmarkName = 'LEFT_MOUTH'; break;
                                        case 6: landmarkName = 'NOSE_BASE'; break;
                                        case 10: landmarkName = 'RIGHT_MOUTH'; break;
                                        case 11: landmarkName = 'RIGHT_EYE'; break;
                                        default: landmarkName = 'UNKNOWN'; break;
                                    }
                                    console.log(`${landmarkName} position: (${landmark.position.x}, ${landmark.position.y})`);
                                });
                            }

                            // Get outlines of features (like lips, eyebrows, face oval)
                            if (faceData.contours) {
                                console.log("Contours detected:", faceData.contours);
                            }
                        });
                    } else {
                        faceResult.textContent += "\nNo faces detected in the image.";
                    }
                },
                function(error) { // This runs if face detection fails
                    console.error("Face detection error:", error);
                    faceResult.textContent = "Error during face detection: " + error;
                }
            );
        }

        // This function runs if the camera fails
        function onFail(message) {
            console.error('Camera failed because: ' + message);
            faceResult.textContent = "Camera error: " + message;
        }
    }
};

app.initialize(); // Start the app when the page loads
