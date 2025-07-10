// SETTINGS of this demo:
const SETTINGS = {
    rotationOffsetX: 0, // negative -> look upper. in radians
    cameraFOV: 40,      // in degrees, 3D camera FOV
    pivotOffsetYZ: [0.2,0.2], // XYZ of the distance between the center of the cube and the pivot
    detectionThreshold: 0.5,    // sensibility, between 0 and 1. Less -> more sensitive
    detectionHysteresis: 0.1,
    scale: 1 // scale of the 3D object (This setting will be mostly controlled by loadedMesh.scaling below)
};

// some globalz:
let BABYLONVIDEOTEXTURE = null, BABYLONENGINE = null, BABYLONFACEOBJ3D = null, BABYLONFACEOBJ3DPIVOTED = null, BABYLONSCENE = null, BABYLONCAMERA = null, ASPECTRATIO = -1, JAWMESH = null;
let ISDETECTED = false;
let loadedGLBMesh = null; // NEW: Global variable to hold your loaded GLB mesh

// analoguous to GLSL smoothStep function:
function smoothStep(edge0, edge1, x){
    const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0.0), 1.0);
    return t * t * (3.0 - 2.0 * t);
}

// callback launched if a face is detected or lost:
function detect_callback(isDetected){
    if (isDetected){
        console.log('INFO in detect_callback(): DETECTED');
    } else {
        console.log('INFO in detect_callback(): LOST');
    }
    // You might want to hide/show the loadedGLBMesh here based on detection
    if (loadedGLBMesh) {
        loadedGLBMesh.setEnabled(isDetected);
    }
}

// build the 3D. called once when Jeeliz Face Filter is OK:
function init_babylonScene(spec){
    // INIT THE BABYLON.JS context:
    BABYLONENGINE = new BABYLON.Engine(spec.GL);

    // CREATE THE SCENE:
    BABYLONSCENE = new BABYLON.Scene(BABYLONENGINE);

    // COMPOSITE OBJECT WHICH WILL FOLLOW THE HEAD:
    // in fact we create 2 objects to be able to shift the pivot point
    BABYLONFACEOBJ3D = new BABYLON.Mesh("faceObj3D", BABYLONSCENE); // Added name for clarity
    BABYLONFACEOBJ3DPIVOTED = new BABYLON.Mesh("faceObj3DPivoted", BABYLONSCENE); // Added name for clarity
    BABYLONFACEOBJ3DPIVOTED.position.set(0, -SETTINGS.pivotOffsetYZ[0], -SETTINGS.pivotOffsetYZ[1]);
    BABYLONFACEOBJ3DPIVOTED.scaling.set(SETTINGS.scale, SETTINGS.scale, SETTINGS.scale);
    BABYLONFACEOBJ3D.addChild(BABYLONFACEOBJ3DPIVOTED);
    // BABYLONSCENE.addMesh(BABYLONFACEOBJ3D); // addChild implicitly adds it to scene if parent is in scene

    // ========================================================================
    // NEW CODE: LOAD YOUR BOX.glb HERE
    // ========================================================================
    // CORRECTED PATH for GLB loading:
    // main.js is in js/
    // BOX.glb is in assets/
    // So from js/main.js, you need to go up one directory (..) to the project root, then down into assets/
    const glbFilePath = './assets/'; // Path to your assets folder relative to index.html (and thus relative to main.js after going up one level)
    const glbFileName = 'BOX.glb'; // Your GLB file name

    BABYLON.SceneLoader.Load(glbFilePath, glbFileName, BABYLONSCENE, function (loadedScene) {
        // Find the main mesh from the loaded scene.
        // This might be loadedScene.meshes[0] or loadedScene.getMeshByName("yourMeshName")
        // Depending on your GLB's structure, you might need to adjust this.
        // Important: For GLB, loadedScene itself is usually the container, and its child meshes are what you want.
        // The standard way to get the root of a GLB is often `loadedScene.meshes[0]` or a specific TransformNode.
        // For a simple GLB like a single box, loadedScene.meshes[0] is often the mesh itself.

        // A more robust way to handle GLB loading is using LoadAssetContainerAsync,
        // which gives you more control over the assets before adding them to the scene.
        // However, your current SceneLoader.Load approach can work if you correctly identify the mesh.

        if (loadedScene.meshes.length > 0) {
            // For simple GLBs, the first mesh is often the main one.
            // Or you might need to get a specific mesh by name: loadedScene.getMeshByName("BOX");
            loadedGLBMesh = loadedScene.meshes[0];
        } else if (loadedScene.transformNodes.length > 0) {
            // If the GLB is just a container of meshes or has a root transform node
            loadedGLBMesh = loadedScene.transformNodes[0]; // This might be the __root__ node for GLTF
        } else {
            console.warn("No suitable mesh or transform node found in the loaded GLB scene.");
            return; // Exit if nothing to attach
        }
        
        // Ensure the mesh is not already parented to the scene root if it's an AssetContainer scenario
        // and you specifically want to attach a child mesh of the container.
        // If loadedGLBMesh is already part of loadedScene.meshes or transformNodes,
        // BABYLONFACEOBJ3DPIVOTED.addChild(loadedGLBMesh); is correct for parenting.
        
        BABYLONFACEOBJ3DPIVOTED.addChild(loadedGLBMesh); // Attach the GLB to the face tracking pivot

        // *** YOU WILL LIKELY NEED TO ADJUST THESE VALUES ***
        // These depend entirely on how your BOX.glb was modeled (scale, pivot point, orientation)
        loadedGLBMesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1); // Start with a very small scale and increase until it looks right
        loadedGLBMesh.position = new BABYLON.Vector3(0, 0, 0); // Adjust X, Y, Z to position relative to the face pivot
        loadedGLBMesh.rotation = new BABYLON.Vector3(0, Math.PI, 0); // Adjust rotation if your model is facing the wrong way (e.g., turn 180 degrees around Y)
        
        // Initially hide the GLB until a face is detected
        loadedGLBMesh.setEnabled(false);

        // If your GLB has animations, you might want to play them:
        if (loadedScene.animationGroups && loadedScene.animationGroups.length > 0) {
            loadedScene.animationGroups[0].play(true); // Play the first animation loop (true for looping)
        }
        console.log('INFO: BOX.glb loaded successfully and attached!');

    }, null, null, function (scene, message, exception) {
        console.error("ERROR: Failed to load GLB:", message, exception);
    });
    // ========================================================================
    // END NEW CODE

    // REMOVED: ORIGINAL CUBE CREATION CODE
    /*
    const cubeMaterial = new BABYLON.StandardMaterial("material", BABYLONSCENE);
    cubeMaterial.emissiveColor = new BABYLON.Color3(0, 0.28, 0.36);
    const babylonCube = new BABYLON.Mesh.CreateBox("box", 1, BABYLONSCENE);
    babylonCube.material = cubeMaterial;
    BABYLONFACEOBJ3DPIVOTED.addChild(babylonCube);
    babylonCube.position.set(0,0,0);
    */

    // CREATE THE MESH MOVING WITH THE JAW (mouth opening):
    // (Keeping this for mouth tracking demo, if you still want it)
    JAWMESH = BABYLON.MeshBuilder.CreateBox("jaw", {height: 0.3, width: 1, depth: 1}, BABYLONSCENE);
    const jawMaterial = new BABYLON.StandardMaterial("jawMat", BABYLONSCENE);
    jawMaterial.emissiveColor = new BABYLON.Color3(0.5, 0, 0); // Make jaw visible
    JAWMESH.material = jawMaterial;
    BABYLONFACEOBJ3DPIVOTED.addChild(JAWMESH);
    JAWMESH.position.set(0,-(0.5+0.15+0.01),0);
    JAWMESH.setEnabled(false); // Initially hide jaw mesh

    // ADD A LIGHT:
    const pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 1, 0), BABYLONSCENE);
    pointLight.intensity = 0.5;

    // init the video texture:
    BABYLONVIDEOTEXTURE = new BABYLON.RawTexture(new Uint8Array([255,0,0,0]),1,1,spec.GL.RGBA,BABYLONSCENE);
    BABYLONVIDEOTEXTURE._texture._webGLTexture = spec.videoTexture;
    
    // CREATE THE VIDEO BACKGROUND
    const videoMaterial = new BABYLON.ShaderMaterial(
        'videoMat',
        BABYLONSCENE,
        {
            vertexElement: "videoMatVertexShaderCode", // see index.html for shader source
            fragmentElement: "videoMatFragmentShaderCode"
        },
        {
            attributes: ["position"],
            uniforms: ["videoTransformMat2"]
            ,needAlphaBlending: false
        }
    );
    videoMaterial.disableDepthWrite = true;
    videoMaterial.setTexture("samplerVideo", BABYLONVIDEOTEXTURE);
    videoMaterial.setMatrix2x2("videoTransformMat2", spec.videoTransformMat2);

    const videoMesh = new BABYLON.Mesh("custom", BABYLONSCENE);
    videoMesh.alwaysSelectAsActiveMesh = true; // disable frustum culling
    const vertexData = new BABYLON.VertexData();
    vertexData.positions = [-1,-1,1,   1,-1,1,   1,1,1,   -1,1,1]; // z is set to 1 (zfar)
    vertexData.indices = [0,1,2, 0,2,3];    
    vertexData.applyToMesh(videoMesh);
    videoMesh.material=videoMaterial;
    
    // CREATE THE CAMERA:
    BABYLONCAMERA = new BABYLON.Camera('camera', new BABYLON.Vector3(0,0,0), BABYLONSCENE);
    BABYLONSCENE.setActiveCameraByName('camera');
    BABYLONCAMERA.fov = SETTINGS.cameraFOV * Math.PI/180;
    BABYLONCAMERA.minZ = 0.1;
    BABYLONCAMERA.maxZ = 100;
    ASPECTRATIO = BABYLONENGINE.getAspectRatio(BABYLONCAMERA);
} //end init_babylonScene()

// entry point:
function main(){
    JEELIZFACEFILTER.init({
        canvasId: 'jeeFaceFilterCanvas',
        // --- IMPORTANT CHANGE HERE ---
        // This path is relative to the location of index.html
        // Since main.js is in js/ and your neural network is in FF/neuralNets/,
        // and index.html is likely in the root, the path should be from the root.
        NNCPath: 'FF/neuralNets/', 
        // ---------------------------
        callbackReady: function(errCode, spec){
            if (errCode){
                console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);
                return;
            }

            console.log('INFO  JEELIZFACEFILTER IS READY');
            init_babylonScene(spec);
        },

        // called at each render iteration (drawing loop):
        callbackTrack: function(detectState){
            if (ISDETECTED && detectState.detected<SETTINGS.detectionThreshold-SETTINGS.detectionHysteresis){
                // DETECTION LOST
                detect_callback(false);
                ISDETECTED = false;
            } else if (!ISDETECTED && detectState.detected>SETTINGS.detectionThreshold+SETTINGS.detectionHysteresis){
                // FACE DETECTED
                detect_callback(true);
                ISDETECTED = true;
            }

            if (ISDETECTED){
                // move the main face object in order to fit the head:
                const tanFOV = Math.tan(ASPECTRATIO*BABYLONCAMERA.fov/2); // tan(FOV/2), in radians
                const W = detectState.s;  // relative width of the detection window (1-> whole width of the detection window)
                const D = 1 / (2*W*tanFOV); // distance between the front face of the cube and the camera
                
                // coords in 2D of the center of the detection window in the viewport:
                const xv = detectState.x;
                const yv = detectState.y;
                
                // coords in 3D of the center of the cube (in the view coordinates system):
                var z = -D - 0.5;    // minus because view coordinate system Z goes backward. -0.5 because z is the coord of the center of the cube (not the front face)
                var x = xv * D * tanFOV;
                var y = yv * D * tanFOV / ASPECTRATIO;

                // move and rotate the main face object:
                BABYLONFACEOBJ3D.position.set(x,y+SETTINGS.pivotOffsetYZ[0],-z-SETTINGS.pivotOffsetYZ[1]);
                BABYLONFACEOBJ3D.rotation.set(-detectState.rx+SETTINGS.rotationOffsetX, -detectState.ry, detectState.rz);//"XYZ" rotation order;
            
                // mouth opening:
                let mouthOpening = detectState.expressions[0];
                mouthOpening = smoothStep(0.35, 0.7, mouthOpening);
                if (JAWMESH) { // Ensure JAWMESH exists
                     JAWMESH.position.y = -(0.5+0.15+0.01+0.7*mouthOpening*0.5);
                     JAWMESH.setEnabled(true); // Show jaw mesh if detected
                }
            } else { // If face not detected
                if (JAWMESH) JAWMESH.setEnabled(false); // Hide jaw mesh
            }

            // reinitialize the state of BABYLON.JS because JEEFACEFILTER have changed stuffs:
            BABYLONENGINE.wipeCaches(true);
            
            // trigger the render of the BABYLON.JS SCENE:
            BABYLONSCENE.render();
            
            BABYLONENGINE.wipeCaches();
        } //end callbackTrack()
    }); //end JEELIZFACEFILTER.init call
} //end main()

window.addEventListener('load', main);
