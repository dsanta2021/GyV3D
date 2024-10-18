import * as THREE from 'https://cdn.skypack.dev/three@0.120.0/build/three.module.js';

// Constantes y variables globales
const restart = document.getElementById("restartBtn");

var scene, perspectiveCamera, renderer;

var pacman;
var movementSpeedPacman = 0.2;
var moveDirection = new THREE.Vector3(); // Dirección de movimiento actual del Pac-Man
var pacmanStartedMoving = false;

var walls = [];

var ghosts = [];
var ghostDirections = [];
var movementSpeedGhosts = 0.25;

var powerUps = [];
var powerUpActive = false;

var scoreSpheres = [];

var lives = 3;
var score = 0;
var gameEnded = false;

var currentCamera; 
var followCamera;
var light;
var zLight = 60;

// Geometrías, colores y texturas
const textures = {
    borderTextureTB: new THREE.TextureLoader().load("muro_largo.jpg"),
    borderTextureLR: new THREE.TextureLoader().load("muro_largo.jpg"),
    floorTexture: new THREE.TextureLoader().load("suelo.jpg"),
    wallTexture: new THREE.TextureLoader().load("muritos.jpg"),
    redGhostTexture: new THREE.TextureLoader().load("fantasmaRojo.jpg"),
    greenGhostTexture: new THREE.TextureLoader().load("fantasmaverde.jpg"),
    pacmanTexture: new THREE.TextureLoader().load("pacman.jpg"),
    powerUpTexture: new THREE.TextureLoader().load("powerUp.jpg"),
    spheresTexture: new THREE.TextureLoader().load("spheres.jpg"),
}

const game = {
    planeGeometry: new THREE.PlaneGeometry(170, 130),
    planeMaterial: new THREE.MeshStandardMaterial({
        map: textures.floorTexture//0x888888
    }),

    borderLRGeometry: new THREE.BoxGeometry(10, 6, 150),
    borderLGMaterial: new THREE.MeshStandardMaterial({
        map: textures.borderTextureLR//0xA36128
    }),

    borderTBGeometry: new THREE.BoxGeometry(190, 6, 10),
    borderTBMaterial: new THREE.MeshStandardMaterial({
        map: textures.borderTextureTB
    }),

    bloque1Geometry: new THREE.BoxGeometry(10, 6, 10),
    bloque1Material: new THREE.MeshStandardMaterial({
        map: textures.wallTexture //0x9F7048
    }),

    bloque2Geometry: new THREE.BoxGeometry(20, 6, 10),
    bloque2Material: new THREE.MeshStandardMaterial({
        map: textures.wallTexture
    }),

    bloque3Geometry: new THREE.BoxGeometry(30, 6, 10),
    bloque3Material: new THREE.MeshStandardMaterial({
        map: textures.wallTexture
    }),

    bloque4Geometry: new THREE.BoxGeometry(40, 6, 10),
    bloque4Material: new THREE.MeshStandardMaterial({
        map: textures.wallTexture
    }),

    bloque5Geometry: new THREE.BoxGeometry(50, 6, 10),
    bloque5Material: new THREE.MeshStandardMaterial({
        map: textures.wallTexture
    }),

    pacmanGeometry: new THREE.SphereGeometry(4, 28, 28),
    pacmanMaterial: new THREE.MeshStandardMaterial({
        map: textures.pacmanTexture
    }),

    powerUpGeometry: new THREE.SphereGeometry(2, 24, 24),
    powerUpMaterial: new THREE.MeshStandardMaterial({
        map: textures.powerUpTexture
    }),

    ghostGeometry: new THREE.SphereGeometry(4, 28, 28),
    ghostMaterial: new THREE.MeshStandardMaterial({
        map: textures.redGhostTexture
    }),
    ghostScapeMaterial: new THREE.MeshStandardMaterial({
        map: textures.greenGhostTexture
    }),

    scoreSphereGeometry: new THREE.SphereGeometry(1, 16, 16),
    scoreSphereMaterial: new THREE.MeshStandardMaterial({
        map: textures.spheresTexture
    }),

}

function init() {
    // Scene
    scene = new THREE.Scene();

    // Renderer
    renderer = new THREE.WebGLRenderer();
    var sceneWidth = window.innerWidth - 30;
    var sceneHeight = window.innerHeight - 30;
    renderer.shadowMap.enabled = true;  // Habilitar sombras
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(sceneWidth, sceneHeight);
    document.body.appendChild(renderer.domElement);

    // Perspective Camera
    perspectiveCamera = new THREE.PerspectiveCamera(90, sceneWidth / sceneHeight, 0.01, 100000);
    perspectiveCamera.position.set(0, 100, 15);
    perspectiveCamera.lookAt(new THREE.Vector3(0, 0, 0));

    // Follow Camera
    followCamera = new THREE.PerspectiveCamera(90, sceneWidth / sceneHeight, 0.01, 100000);
    followCamera.position.set(0, 10, -15);
    followCamera.lookAt(new THREE.Vector3(0, 0, 0));

    // Light
    light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(0, 50, -60);
    light.castShadow = true;
    light.shadow.camera.near = 0;
    light.shadow.camera.far = 400;
    light.shadow.camera.left = -90;
    light.shadow.camera.right = 90;
    light.shadow.camera.top = 70;
    light.shadow.camera.bottom = -70;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;

    // Plano
    var floor = new THREE.Mesh(game.planeGeometry, game.planeMaterial);
    floor.rotation.x = -0.5 * Math.PI;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Crear bordes, muros, pacman y potenciadores
    createBorders();
    createWalls();
    pacman = createPacman();
    createPowerUps();
    createGhosts();
    createScoreSpheres();

    // Activar recibir sombras
    walls.forEach(wall => {
        wall.receiveShadow = true; // Permitir que los muros reciban sombras
    });
}

// Función para generar una posición aleatoria válida
function generateRandomPosition(quadrant) {
    var minX, maxX, minZ, maxZ;
    var position;
    var isValidPosition = false;
    var attempts = 0;
    var maxAttempts = 100;

    switch (quadrant) {
        case 1: // Cuarto superior izquierdo
            minX = -80; maxX = -10; minZ = -60; maxZ = -10;
            break;
        case 2: // Cuarto superior derecho
            minX = 10; maxX = 80; minZ = -60; maxZ = -10;
            break;
        case 3: // Cuarto inferior izquierdo
            minX = -80; maxX = -10; minZ = 10; maxZ = 60;
            break;
        case 4: // Cuarto inferior derecho
            minX = 10; maxX = 80; minZ = 10; maxZ = 60;
            break;
    }

    while (!isValidPosition && attempts < maxAttempts) {
        var x = Math.random() * (maxX - minX) + minX;
        var z = Math.random() * (maxZ - minZ) + minZ;
        position = new THREE.Vector3(Math.round(x / 20) * 20, 3, Math.round(z / 20) * 20); // Centrados en los caminos

        isValidPosition = true;

        // Verificar si la posición está en el centro
        if (Math.abs(x) < 10 && Math.abs(z) < 10) {
            isValidPosition = false;
        }

        // Crear una caja de contorno para la posición
        var tempSphere = new THREE.Mesh(new THREE.SphereGeometry(2, 24, 24));
        tempSphere.position.copy(position);
        var positionBox = new THREE.Box3().setFromObject(tempSphere);

        // Verificar colisiones con muros
        for (var i = 0; i < walls.length; i++) {
            var wallBox = new THREE.Box3().setFromObject(walls[i]);
            if (positionBox.intersectsBox(wallBox)) {
                isValidPosition = false;
                break;
            }
        }

        // Verificar colisiones con Pac-Man
        var pacmanBox = new THREE.Box3().setFromObject(pacman);
        if (positionBox.intersectsBox(pacmanBox)) {
            isValidPosition = false;
        }

        attempts++;
    }

    return position;
}

// Función para generar una posición aleatoria válida para un potenciador
function generateRandomPowerUpPosition() {
    var isValidPosition = false;
    var position;
    var quadrant;


    // Intentar encontrar una posición válida para el potenciador
    while (!isValidPosition) {

        quadrant = Math.floor(Math.random() * 4) + 1;
        position = generateRandomPosition(quadrant);

        // Verificar si la posición está obstruida por muros, fantasmas o el Pac-Man
        isValidPosition = !isPositionObstructed(position.x, position.z);
    }

    return position;
}

// Función para crear los bordes del plano
function createBorders() {
    var materialLR = game.borderLGMaterial;
    materialLR.map.repeat.set(1, 20);
    materialLR.map.wrapS = THREE.RepeatWrapping;
    materialLR.map.wrapT = THREE.RepeatWrapping;
    materialLR.side = THREE.DoubleSide;

    var materialTB = game.borderTBMaterial;
    materialTB.map.repeat.set(5, 1);
    materialTB.map.wrapS = THREE.RepeatWrapping;
    materialTB.map.wrapT = THREE.RepeatWrapping;
    materialTB.side = THREE.DoubleSide;

    var borderL = new THREE.Mesh(game.borderLRGeometry, materialLR);
    borderL.position.set(-90, 3, 0);

    var borderR = new THREE.Mesh(game.borderLRGeometry, materialLR);
    borderR.position.set(90, 3, 0);

    var borderT = new THREE.Mesh(game.borderTBGeometry, materialTB);
    borderT.position.set(0, 3, -70);

    var borderB = new THREE.Mesh(game.borderTBGeometry, materialTB);
    borderB.position.set(0, 3, 70);

    scene.add(borderL, borderR, borderT, borderB);
    walls.push(borderL, borderR, borderT, borderB);
}

// Función para crear los muros dentro del plano
function createWalls() {
    var muro15 = new THREE.Mesh(game.bloque5Geometry, game.bloque5Material);
    muro15.position.set(0, 3, 10);

    var muro14 = new THREE.Mesh(game.bloque2Geometry, game.bloque2Material);
    muro14.rotation.y = -0.5 * Math.PI;
    muro14.position.set(-20, 3, -5);

    var muro20 = muro14.clone();
    muro20.rotation.y = -0.5 * Math.PI;
    muro20.position.set(20, 3, -5);

    var muro13 = muro15.clone();
    muro13.position.set(0, 3, -30);

    var muro16 = muro15.clone();
    muro16.position.set(0, 3, 30);

    var muro17_1 = muro14.clone();
    muro17_1.position.set(10, 3, 55);

    var muro17_2 = muro14.clone();
    muro17_2.position.set(-10, 3, 55);

    var muro12_1 = new THREE.Mesh(game.bloque2Geometry, game.bloque2Material);
    muro12_1.position.set(15, 3, -50);

    var muro12_2 = muro14.clone();
    muro12_2.position.set(-10, 3, -55);

    var muro11 = new THREE.Mesh(game.bloque3Geometry, game.bloque3Material);
    muro11.position.set(-40, 3, -50);

    var muro10 = muro11.clone();
    muro10.rotation.y = -0.5 * Math.PI;
    muro10.position.set(-40, 3, -30);

    var muro1 = new THREE.Mesh(game.bloque2Geometry, game.bloque2Material);
    muro1.position.set(-65, 3, -50);

    var muro2 = muro1.clone();
    muro2.position.set(-65, 3, -30);

    var muro3 = muro11.clone();
    muro3.position.set(-70, 3, 0);

    var muro4 = muro1.clone();
    muro4.position.set(-65, 3, 20);

    var muro5 = muro1.clone();
    muro5.position.set(-65, 3, 40);

    var muro6 = new THREE.Mesh(game.bloque1Geometry, game.bloque1Material);
    muro6.position.set(-70, 3, 50);

    var muro7 = muro6.clone();
    muro7.position.set(-50, 3, 60);

    var muro8 = muro1.clone();
    muro8.position.set(-25, 3, 50);

    var muro9 = new THREE.Mesh(game.bloque4Geometry, game.bloque4Material);
    muro9.rotation.y = -0.5 * Math.PI;
    muro9.position.set(-40, 3, 15);

    var muro22 = muro6.clone();
    muro22.position.set(20, 3, -50);

    var muro21 = muro9.clone();
    muro21.position.set(40, 3, -35);

    var muro23 = muro1.clone();
    muro23.position.set(65, 3, -50);

    var muro24 = muro6.clone();
    muro24.position.set(60, 3, -30);

    var muro25 = muro6.clone();
    muro25.position.set(70, 3, -20);

    var muro26 = new THREE.Mesh(game.bloque4Geometry, game.bloque4Material);
    muro26.position.set(55, 3, 0);

    var muro18 = muro1.clone();
    muro18.position.set(35, 3, 50);

    var muro19 = muro10.clone();
    muro19.position.set(40, 3, 30);

    var muro27 = muro1.clone();
    muro27.position.set(65, 3, 20);

    var muro28 = muro1.clone();
    muro28.position.set(65, 3, 30);

    var muro29 = muro11.clone();
    muro29.position.set(70, 3, 50);

    var muro30 = muro14.clone();
    muro30.rotation.y = -0.5 * Math.PI;
    muro30.position.set(0, 3, -15);

    scene.add(muro15, muro14, muro20, muro13, muro16, muro17_1, muro17_2, muro12_1, muro12_2, muro11, muro10,
        muro1, muro2, muro3, muro4, muro5, muro6, muro7, muro8, muro9, muro21, muro23, muro24, muro25,
        muro26, muro18, muro19, muro27, muro28, muro29, muro30);

    walls.push(muro15, muro14, muro20, muro13, muro16, muro17_1, muro17_2, muro12_1, muro12_2, muro11, muro10,
        muro1, muro2, muro3, muro4, muro5, muro6, muro7, muro8, muro9, muro21, muro23, muro24, muro25,
        muro26, muro18, muro19, muro27, muro28, muro29, muro30);

}

// Función para crear el Pac-Man
function createPacman() {
    var pacman = new THREE.Mesh(game.pacmanGeometry, game.pacmanMaterial);
    pacman.position.set(0, 5, 60); // Posición inicial del Pac-Man
    pacman.castShadow = true;
    pacman.receiveShadow = true;
    scene.add(pacman);
    return pacman;
}

// Función para crear los potenciadores
function createPowerUps() {
    for (var i = 1; i < 5; i++) {
        var powerUp = new THREE.Mesh(game.powerUpGeometry, game.powerUpMaterial);

        var position = generateRandomPosition(i);
        powerUp.position.copy(position);
        powerUp.castShadow = true;
        powerUp.receiveShadow = true;

        scene.add(powerUp);
        powerUps.push(powerUp);
    }
}

// Función para crear los fantasmas
function createGhosts() {
    var numGhosts = 3; 
    var ghostOffset = 10; // Espacio entre cada fantasma

    for (var i = 0; i < numGhosts; i++) {
        var ghost = new THREE.Mesh(game.ghostGeometry, game.ghostMaterial);
        ghost.position.set((ghostOffset * i) - 10, 5, 0); 
        ghost.castShadow = true;
        ghost.receiveShadow = true;
        scene.add(ghost);
        ghosts.push(ghost);
        ghostDirections.push(getRandomDirection());
    }
}

// Función para manejar el inicio del movimiento del Pac-Man
function startMoving(event) {
    var keyCode = event.keyCode;
    var newDirection;

    // Asignar la dirección de movimiento basada en la tecla presionada
    switch (keyCode) {
        case 37: // Tecla izquierda
            newDirection = new THREE.Vector3(-1, 0, 0);
            zLight = 60;
            break;
        case 38: // Tecla arriba
            newDirection = new THREE.Vector3(0, 0, -1);
            break;
        case 39: // Tecla derecha
            newDirection = new THREE.Vector3(1, 0, 0);
            break;
        case 40: // Tecla abajo
            newDirection = new THREE.Vector3(0, 0, 1);
            zLight = -60;
            break;
    }

    // Verificar si la nueva dirección es válida
    var newPosition = pacman.position.clone().add(newDirection.clone().multiplyScalar(movementSpeedPacman));
    if (isPositionValid(newPosition)) {
        // Si la nueva dirección es válida, cambiar la dirección de movimiento
        moveDirection = newDirection;

        // Si es la primera vez que Pac-Man se mueve, iniciar el movimiento de los fantasmas
        if (!pacmanStartedMoving) {
            pacmanStartedMoving = true;
            movePacman();
            moveGhosts();

            // Crear un fantasma y un potenciador cada x segundos
            setInterval(spawnGhost, 30000);
            setInterval(spawnPowerUp, 40000);
        }
    } else {
        // Actualizar la dirección incluso si no es válida
        moveDirection = newDirection;
    }
}

// Función para manejar el final del movimiento del Pac-Man
function stopMoving() {
    moveDirection.set(0, 0, 0);
    updateLivesDisplay();
}

// Función para manejar el movimiento continuo del Pac-Man
function movePacman() {
    if (gameEnded) return; 
    if (pacmanStartedMoving) {
        var moveDistance = moveDirection.clone().multiplyScalar(movementSpeedPacman);

        var newPosition = pacman.position.clone().add(moveDistance);

        // Verificar si la nueva posición está dentro de los límites del mapa
        if (isPositionValid(newPosition)) {
            pacman.position.copy(newPosition);
            checkPowerUpCollision();
            handleScoreInteraction();
        } else {
            stopMoving();
        }

        checkPacGhostCollision();

        requestAnimationFrame(movePacman);
    }
}

// Función para detener el movimiento del Pac-Man
function stopPacmanMovement() {
    // Remover el event listener que maneja las teclas de flecha
    window.removeEventListener("keydown", movePacman);
}

// Función para validar colisiones con muros y bordes
function isPositionValid(position) {
    var minX = -80; // Límite izquierdo
    var maxX = 80; // Límite derecho
    var minZ = -60; // Límite inferior
    var maxZ = 60; // Límite superior

    var pacmanBox = new THREE.Box3().setFromObject(pacman);
    pacmanBox.translate(position.clone().sub(pacman.position)); 

    for (var i = 0; i < walls.length; i++) {
        var wallBox = new THREE.Box3().setFromObject(walls[i]);
        if (pacmanBox.intersectsBox(wallBox)) {
            return false;
        }
    }

    return (
        position.x >= minX && position.x <= maxX &&
        position.z >= minZ && position.z <= maxZ
    );
}

// Función para verificar colisiones de Pac-Man con potenciadores
function checkPowerUpCollision() {
    var pacmanBox = new THREE.Box3().setFromObject(pacman);

    for (var i = 0; i < powerUps.length; i++) {
        var powerUpBox = new THREE.Box3().setFromObject(powerUps[i]);

        if (pacmanBox.intersectsBox(powerUpBox)) {
            activatePowerUp(i);
            break;
        }
    }
}

// Función para activar un potenciador
function activatePowerUp(index) {
    powerUpActive = true;
    scene.remove(powerUps[index]);
    powerUps.splice(index, 1);
    movementSpeedPacman = 0.35;
    movementSpeedGhosts = 0.5;

    // Cambiar color de los fantasmas
    ghosts.forEach(ghost => {
        ghost.material = game.ghostScapeMaterial;
    });

    // Desactivar el potenciador después de 10 segundos
    setTimeout(() => {
        ghosts.forEach(ghost => {
            ghost.material = game.ghostMaterial;
        });
        movementSpeedPacman = 0.2;
        movementSpeedGhosts = 0.25;
        powerUpActive = false;
    }, 10000);
}

// Función para mover los fantasmas
function moveGhosts() {
    if (pacmanStartedMoving) {
        for (var i = 0; i < ghosts.length; i++) {
            var ghost = ghosts[i];
            var direction = ghostDirections[i];
            var moveDistance = direction.clone().multiplyScalar(movementSpeedGhosts);
            var newPosition = ghost.position.clone().add(moveDistance);

            if (isPositionValid(newPosition)) {
                ghost.position.copy(newPosition);
            } else {
                ghostDirections[i] = getRandomDirection();
            }
        }
        // Solicitar el siguiente fotograma de animación
        requestAnimationFrame(moveGhosts);
    }
}

// Función para obtener una dirección aleatoria
function getRandomDirection() {
    var directions = [
        new THREE.Vector3(1, 0, 0),  // Derecha
        new THREE.Vector3(-1, 0, 0), // Izquierda
        new THREE.Vector3(0, 0, 1),  // Abajo
        new THREE.Vector3(0, 0, -1)  // Arriba
    ];
    return directions[Math.floor(Math.random() * directions.length)];
}

// Función para verificar colisión del pacman con los fantasmas
function checkPacGhostCollision() {
    var pacmanBox = new THREE.Box3().setFromObject(pacman);

    for (var i = 0; i < ghosts.length; i++) {
        var ghostBox = new THREE.Box3().setFromObject(ghosts[i]);

        if (pacmanBox.intersectsBox(ghostBox)) {
            if (powerUpActive) {
                // Si el pacman tiene potenciador, el fantasma desaparece
                scene.remove(ghosts[i]);
                ghosts.splice(i, 1);
                ghostDirections.splice(i, 1);
            } else {
                // Si no tiene potenciador, el pacman pierde una vida
                // y vuelve a la posición inicial
                pacman.position.set(0, 5, 60); // Posición inicial del Pac-Man
                // Restar una vida al contador de vidas del pacman
                lives--;
                stopMoving();
            }
            break;
        }
    }
}

// Función para crear las esferas de puntuación
function createScoreSpheres() {
    for (var x = -80; x <= 80; x += 10) {
        for (var z = -60; z <= 60; z += 10) {

            if (!isPositionObstructed(x, z)) {
                var sphere = new THREE.Mesh(game.scoreSphereGeometry, game.scoreSphereMaterial);
                sphere.position.set(x, 3, z);
                scene.add(sphere);
                scoreSpheres.push(sphere);
            }
        }
    }
}

// Función para verificar si una posición está obstruida por muros, potenciadores, fantasmas o Pac-Man
function isPositionObstructed(x, z) {
    var position = new THREE.Vector3(x, 0, z);

    var intersectionCount = 0;

    // Rayo desde la posición de la esfera hacia el muro
    var ray = new THREE.Raycaster(position, new THREE.Vector3(0, 1, 0));

    // Verificar intersecciones con cada muro
    for (var i = 0; i < walls.length; i++) {
        var intersection = ray.intersectObject(walls[i]);

        if (intersection.length > 0 && intersection[0].distance < 10) {
            intersectionCount++;
        }
    }

    if (intersectionCount % 2 === 1) {
        return true;
    }

    // Verificar colisión con potenciadores
    for (var i = 0; i < powerUps.length; i++) {
        if (powerUps[i].position.distanceTo(position) < 10) {
            return true;
        }
    }

    // Verificar colisión con fantasmas
    for (var i = 0; i < ghosts.length; i++) {
        if (ghosts[i].position.distanceTo(position) < 10) {
            return true;
        }
    }

    // Verificar colisión con Pac-Man
    if (pacman.position.distanceTo(position) < 10) {
        return true;
    }

    for (var i = 0; i < scoreSpheres.length; i++) {
        if (scoreSpheres[i].position.distanceTo(position) < 10) {
            return true;
        }
    }

    return false;
}

// Función para manejar la interacción del Pac-Man con las esferas de puntuación
function handleScoreInteraction() {
    var pacmanBox = new THREE.Box3().setFromObject(pacman);

    for (var i = 0; i < scoreSpheres.length; i++) {
        var sphereBox = new THREE.Box3().setFromObject(scoreSpheres[i]);

        if (pacmanBox.intersectsBox(sphereBox)) {
            scene.remove(scoreSpheres[i]);
            scoreSpheres.splice(i, 1);
            score++;
            updateScoreDisplay();
        }
    }
}

function spawnGhost() {
    var ghost = new THREE.Mesh(game.ghostGeometry, game.ghostMaterial);

    ghost.position.set(0, 5, 0);
    ghost.castShadow = true;
    ghost.receiveShadow = true;

    scene.add(ghost);
    ghosts.push(ghost);
    ghostDirections.push(getRandomDirection()); // Dirección inicial aleatoria
}

// Función para generar un potenciador en una posición aleatoria del mapa
function spawnPowerUp() {
    var powerUp = new THREE.Mesh(game.powerUpGeometry, game.powerUpMaterial);

    // Generar posición aleatoria válida para el potenciador
    var position = generateRandomPowerUpPosition();
    powerUp.position.copy(position);
    powerUp.castShadow = true;
    powerUp.receiveShadow = true;

    scene.add(powerUp);
    powerUps.push(powerUp);
}

// Función para verificar el estado del juego (ganar o perder)
function checkGameStatus() {
    // Condición de victoria
    if (ghosts.length === 0 || scoreSpheres.length === 0) {
        showMessage("¡Felicidades! ¡Has ganado!");
        return;
    }

    // Condición de derrota
    if (lives <= 0 || (ghosts.length > 0 && powerUps.length === 0)) {
        if (!powerUpActive) {
            showMessage("¡Has perdido! Una pena...");
            return;
        }
        return;
    }
}

function showMessage(message) {
    var msg = document.getElementById("messageBox");
    gameEnded = true;
    msg.innerHTML = message;
    msg.style.display = "block";
    restart.style.display = "block";
    stopPacmanMovement();
}

// Función para actualizar el contador de vidas en el HTML
function updateLivesDisplay() {
    var livesDisplay = document.getElementById("livesCount");
    livesDisplay.innerHTML = lives;
}

// Función para actualizar el display de puntuación en el HTML
function updateScoreDisplay() {
    var scoreDisplay = document.getElementById("scoreCount");
    scoreDisplay.innerHTML = score;
}

// Llamar a la función de mover fantasmas en el bucle de renderizado (animate)
function animate() {
    const camera = document.querySelector('input[name="camera"]:checked').value;

    console.log(camera);
    requestAnimationFrame(animate);

    // Actualizar la posición de la cámara siguiendo a Pac-Man si está activa la opción
    if (camera === 'follow') {
        
        var offset = new THREE.Vector3(0, 0, 0); 
        offset.applyQuaternion(pacman.quaternion); 

        var cameraPosition = new THREE.Vector3().addVectors(pacman.position, offset); 
        var lookAtPosition = pacman.position.clone().add(moveDirection);

        followCamera.position.copy(cameraPosition);
        followCamera.lookAt(lookAtPosition);
        currentCamera = followCamera;

        // Luz
        light.position.set(30, 50, zLight);
        light.target = pacman;

    } else if (camera === 'perspective') {
        currentCamera = perspectiveCamera;
        light.position.set(pacman.position.x, 70, pacman.position.z);
        var targetObject = new THREE.Object3D();
        targetObject.position.set(0, 0, 0);
        scene.add(targetObject);
        light.target = targetObject;

    } else {
        currentCamera = perspectiveCamera;
        light.position.set(0, 50, -60);
        var targetObject = new THREE.Object3D();
        targetObject.position.set(0, 0, 0);
        scene.add(targetObject);
        light.target = targetObject;
    }

    scene.add(light);

    // Renderizar la escena con la cámara seleccionada
    renderer.render(scene, currentCamera);
    // controls.update();
    checkGameStatus();
}

// Evento de teclado para iniciar el movimiento del Pac-Man
document.addEventListener('keydown', startMoving);

restart.onclick = () => {
    location.reload();
};

init();
updateLivesDisplay();
animate();

