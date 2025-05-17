// Three.js Scene Setup
let scene, camera, renderer, controls;
let userModelGroup, computerModelGroup;
let rockModel, paperModel, scissorsModel;
let modelsLoaded = false;
let animationMixer;
let animations = {};
let clock = new THREE.Clock();
let particleSystem, particles;
let bgParticles;

// Setup for models
const MODELS = {
    ROCK: 'rock',
    PAPER: 'paper',
    SCISSORS: 'scissors'
};

// Initialize the scene
function initScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12082d);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(document.getElementById('scene').clientWidth, document.getElementById('scene').clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('scene').appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Add spot light
    const spotLight = new THREE.SpotLight(0x6c42f5, 1);
    spotLight.position.set(-5, 10, 7);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.3;
    spotLight.castShadow = true;
    scene.add(spotLight);
    
    // Add point light with glow
    const pointLight = new THREE.PointLight(0xaa42f5, 1, 100);
    pointLight.position.set(0, 3, 0);
    scene.add(pointLight);
    
    // Add pulsating light
    const pulseLight = new THREE.PointLight(0x42f5d9, 1, 50);
    pulseLight.position.set(0, -2, -5);
    scene.add(pulseLight);
    
    // Animate the pulsating light
    animatePulseLight(pulseLight);
    
    // Create background particles
    createBackgroundParticles();
    
    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enabled = false; // Disable controls initially
    
    // Create model groups
    userModelGroup = new THREE.Group();
    userModelGroup.position.set(-1.5, 0, 0);
    scene.add(userModelGroup);
    
    computerModelGroup = new THREE.Group();
    computerModelGroup.position.set(1.5, 0, 0);
    scene.add(computerModelGroup);
    
    // Load models
    loadModels();
    
    // Add event listener for window resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Start animation loop
    animate();
}

// Create background particles
function createBackgroundParticles() {
    const particleCount = 200;
    bgParticles = new THREE.Group();
    
    const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    
    for (let i = 0; i < particleCount; i++) {
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(
                0.5 + Math.random() * 0.5,
                0.5 + Math.random() * 0.5,
                0.7 + Math.random() * 0.3
            ),
            transparent: true,
            opacity: 0.3 + Math.random() * 0.5
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Random position
        particle.position.x = (Math.random() - 0.5) * 20;
        particle.position.y = (Math.random() - 0.5) * 20;
        particle.position.z = (Math.random() - 0.5) * 20;
        
        // Store original position for animation
        particle.userData.originalPos = particle.position.clone();
        
        // Random speed
        particle.userData.speed = 0.01 + Math.random() * 0.02;
        
        bgParticles.add(particle);
    }
    
    scene.add(bgParticles);
}

// Animate pulsating light
function animatePulseLight(light) {
    const initialIntensity = light.intensity;
    
    function pulse() {
        light.intensity = initialIntensity + Math.sin(Date.now() * 0.002) * 0.5;
        requestAnimationFrame(pulse);
    }
    
    pulse();
}

// Load 3D models with GLTFLoader
function loadModels() {
    const loader = new THREE.GLTFLoader();
    const loadingManager = new THREE.LoadingManager();
    
    loadingManager.onLoad = function() {
        modelsLoaded = true;
        console.log('All models loaded successfully');
        updateResultText('Choose your move!');
    };
    
    loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        const progress = (itemsLoaded / itemsTotal * 100).toFixed(0);
        updateResultText(`Loading models... ${progress}%`);
    };
    
    loadingManager.onError = function(url) {
        console.error('Error loading model:', url);
        updateResultText('Error loading models. Please refresh.');
    };
    
    // Since we don't have actual model files, we'll use primitive geometries as placeholders
    // In a real implementation, you would replace these with actual GLTF models
    
    // Create rock model (sphere)
    const rockGeometry = new THREE.DodecahedronGeometry(0.8, 2);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        roughness: 0.8,
        metalness: 0.2,
        flatShading: true
    });
    rockModel = new THREE.Mesh(rockGeometry, rockMaterial);
    rockModel.castShadow = true;
    rockModel.receiveShadow = true;
    
    // Create paper model (plane)
    const paperGeometry = new THREE.BoxGeometry(1.2, 0.1, 1.2, 3, 1, 3);
    const paperMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.1,
        flatShading: true
    });
    paperModel = new THREE.Mesh(paperGeometry, paperMaterial);
    
    // Deform the paper geometry to make it more like a piece of paper
    const vertices = paperGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i + 1] += Math.sin(vertices[i] * 2) * 0.05;
        vertices[i + 1] += Math.cos(vertices[i + 2] * 3) * 0.05;
    }
    paperGeometry.attributes.position.needsUpdate = true;
    
    paperModel.castShadow = true;
    paperModel.receiveShadow = true;
    
    // Create scissors model (two cylinders)
    scissorsModel = new THREE.Group();
    
    const cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 32);
    const scissorsMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc,
        roughness: 0.3,
        metalness: 0.8
    });
    
    // Add blades to the scissors
    const bladeGeometry = new THREE.ConeGeometry(0.15, 0.8, 32);
    const bladeMaterial = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        metalness: 0.9,
        roughness: 0.2
    });
    
    const handle1 = new THREE.Mesh(cylinderGeometry, scissorsMaterial);
    handle1.position.set(0.2, 0, 0);
    handle1.rotation.z = Math.PI / 4;
    handle1.castShadow = true;
    handle1.receiveShadow = true;
    scissorsModel.add(handle1);
    
    const blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade1.position.set(0.2 + Math.sin(Math.PI / 4) * 0.8, Math.cos(Math.PI / 4) * 0.8, 0);
    blade1.rotation.z = Math.PI / 4;
    blade1.castShadow = true;
    blade1.receiveShadow = true;
    scissorsModel.add(blade1);
    
    const handle2 = new THREE.Mesh(cylinderGeometry, scissorsMaterial);
    handle2.position.set(-0.2, 0, 0);
    handle2.rotation.z = -Math.PI / 4;
    handle2.castShadow = true;
    handle2.receiveShadow = true;
    scissorsModel.add(handle2);
    
    const blade2 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade2.position.set(-0.2 - Math.sin(Math.PI / 4) * 0.8, Math.cos(Math.PI / 4) * 0.8, 0);
    blade2.rotation.z = -Math.PI / 4;
    blade2.castShadow = true;
    blade2.receiveShadow = true;
    scissorsModel.add(blade2);
    
    // Create plane for shadow
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x221052,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -1.5;
    ground.receiveShadow = true;
    
    // Add grid lines to the ground
    const gridHelper = new THREE.GridHelper(20, 20, 0x6c42f5, 0x341080);
    gridHelper.position.y = -1.49;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
    
    scene.add(ground);
    
    // Notify loading manager that models are loaded
    loadingManager.onLoad();
}

// Handle window resize
function onWindowResize() {
    camera.aspect = document.getElementById('scene').clientWidth / document.getElementById('scene').clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(document.getElementById('scene').clientWidth, document.getElementById('scene').clientHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
    // Update animation mixer if exists
    if (animationMixer) {
        animationMixer.update(delta);
    }
    
    // Rotate models slightly
    if (userModelGroup.children.length > 0) {
        userModelGroup.children[0].rotation.y += 0.01;
        userModelGroup.children[0].position.y = Math.sin(time * 2) * 0.1;
    }
    
    if (computerModelGroup.children.length > 0) {
        computerModelGroup.children[0].rotation.y += 0.01;
        computerModelGroup.children[0].position.y = Math.sin(time * 2 + Math.PI) * 0.1;
    }
    
    // Animate background particles
    if (bgParticles) {
        bgParticles.children.forEach(particle => {
            // Make particles float around
            particle.position.y += Math.sin(time + particle.position.x) * 0.002;
            particle.position.x += Math.cos(time + particle.position.z) * 0.002;
            
            // Reset particles that move too far
            if (particle.position.distanceTo(particle.userData.originalPos) > 2) {
                particle.position.copy(particle.userData.originalPos);
            }
            
            // Pulse opacity
            particle.material.opacity = (0.3 + Math.sin(time * particle.userData.speed) * 0.2);
        });
    }
    
    // Update controls
    controls.update();
    
    // Render scene
    renderer.render(scene, camera);
}

// Display a model on the scene
function displayModel(modelType, isUser = true) {
    // Remove any existing models from the group
    const group = isUser ? userModelGroup : computerModelGroup;
    while (group.children.length > 0) {
        group.remove(group.children[0]);
    }
    
    let model;
    
    // Select the appropriate model based on modelType
    switch(modelType) {
        case MODELS.ROCK:
            model = rockModel.clone();
            break;
        case MODELS.PAPER:
            model = paperModel.clone();
            break;
        case MODELS.SCISSORS:
            model = scissorsModel.clone();
            break;
        default:
            console.error('Invalid model type:', modelType);
            return;
    }
    
    // Add the model to the group
    group.add(model);
    
    // Animate model entrance
    animateModelEntrance(group, isUser);
}

// Animate model entrance with a bouncing effect
function animateModelEntrance(modelGroup, isUser) {
    // Initial position (up and out of view)
    modelGroup.position.y = 3;
    modelGroup.scale.set(0.1, 0.1, 0.1);
    
    // Set x position based on whether it's user or computer
    modelGroup.position.x = isUser ? -1.5 : 1.5;
    
    // Create a timeline animation
    const duration = 1.0;
    const startTime = Date.now();
    
    function animateEntrance() {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsedTime / duration, 1.0);
        
        // Easing function for bouncing effect
        const bounce = function(t) {
            return 1 - Math.pow(1 - t, 3) - 0.1 * Math.sin(t * Math.PI * 8) * Math.pow(1 - t, 2);
        };
        
        // Apply animation to position and scale
        modelGroup.position.y = 3 * (1 - bounce(progress));
        const scale = 0.1 + 0.9 * bounce(progress);
        modelGroup.scale.set(scale, scale, scale);
        
        // Continue animation if not finished
        if (progress < 1.0) {
            requestAnimationFrame(animateEntrance);
        }
    }
    
    // Start animation
    animateEntrance();
}

// Function to update result text (to be called from main.js)
function updateResultText(message, resultClass = '') {
    const resultText = document.getElementById('result-text');
    resultText.textContent = message;
    
    // Remove existing classes
    resultText.classList.remove('win', 'lose', 'draw');
    
    // Add new class if provided
    if (resultClass) {
        resultText.classList.add(resultClass);
    }
}

// Function to animate winning model
function animateWinner(isUser) {
    const group = isUser ? userModelGroup : computerModelGroup;
    
    // Create a timeline animation for victory
    const duration = 1.0;
    const startTime = Date.now();
    const initialY = group.position.y;
    
    function animateVictory() {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsedTime / duration, 1.0);
        
        // Make the winning model bounce up and down
        group.position.y = initialY + Math.sin(progress * Math.PI * 4) * 0.5 * (1 - progress);
        group.rotation.y += 0.1;
        
        // Add a victory scale pulse
        const scale = 1.0 + 0.2 * Math.sin(progress * Math.PI * 2);
        group.scale.set(scale, scale, scale);
        
        // Continue animation if not finished
        if (progress < 1.0) {
            requestAnimationFrame(animateVictory);
        } else {
            // Reset rotation and scale when finished
            group.scale.set(1, 1, 1);
        }
    }
    
    // Start animation
    animateVictory();
}

// Move camera to focus on winning model
function focusCameraOnWinner(isUser) {
    const targetPosition = isUser ? 
        new THREE.Vector3(-1.5, 0, 3) : 
        new THREE.Vector3(1.5, 0, 3);
    
    const startPosition = camera.position.clone();
    const duration = 1.0;
    const startTime = Date.now();
    
    function animateCamera() {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsedTime / duration, 1.0);
        
        // Smooth easing function
        const ease = function(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        };
        
        // Interpolate camera position
        camera.position.lerpVectors(startPosition, targetPosition, ease(progress));
        
        // Look at the center
        camera.lookAt(0, 0, 0);
        
        // Continue animation if not finished
        if (progress < 1.0) {
            requestAnimationFrame(animateCamera);
        }
    }
    
    // Start animation
    animateCamera();
}

// Reset camera to original position
function resetCamera() {
    const targetPosition = new THREE.Vector3(0, 0, 5);
    const startPosition = camera.position.clone();
    const duration = 1.0;
    const startTime = Date.now();
    
    function animateCamera() {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsedTime / duration, 1.0);
        
        // Smooth easing function
        const ease = function(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        };
        
        // Interpolate camera position
        camera.position.lerpVectors(startPosition, targetPosition, ease(progress));
        
        // Look at the center
        camera.lookAt(0, 0, 0);
        
        // Continue animation if not finished
        if (progress < 1.0) {
            requestAnimationFrame(animateCamera);
        }
    }
    
    // Start animation
    animateCamera();
} 