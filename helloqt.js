var container = document.getElementById("container");
var camera = null;
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer({ antialias: true });
var cbTexture;
var cbScene;
var cbCamera;
var cbUniforms = {
    dy: { type: "f", value: 0 }
};
var cb;
var logo;
var spotlight;

var viewSize = {
    w: 0,
    h: 0,
    update: function () {
        viewSize.w = window.innerWidth;
        viewSize.h = window.innerHeight;
    }
};

var onResize = function (event) {
    viewSize.update();
    if (!camera) {
        camera = new THREE.PerspectiveCamera(60, viewSize.w / viewSize.h, 0.01, 100);
    } else {
        camera.aspect = viewSize.w / viewSize.h;
        camera.updateProjectionMatrix();
    }
    renderer.setSize(viewSize.w, viewSize.h);
};

var setupCheckerboard = function () {
    cbTexture = new THREE.WebGLRenderTarget(512, 512,
                                            { minFilter: THREE.LinearFilter,
                                              magFilter: THREE.LinearFilter,
                                              format: THREE.RGBFormat });
    cbScene = new THREE.Scene();
    cbCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);
    var geom = new THREE.PlaneGeometry(2, 2);
    var material = new THREE.ShaderMaterial({
        uniforms: cbUniforms,
        vertexShader: document.getElementById("vsChecker").textContent,
        fragmentShader: document.getElementById("fsChecker").textContent
    });
    var mesh = new THREE.Mesh(geom, material);
    cbScene.add(mesh);
};

var renderCheckerboard = function () {
    cbUniforms.dy.value += 0.01;
    renderer.render(cbScene, cbCamera, cbTexture, true);
};

var generateLogo = function () {
    var geom = new THREE.Geometry();
    var idx = 0;
    for (var i = 0; i < qtlogo.length; i += 18) {
        geom.vertices.push(new THREE.Vector3(qtlogo[i], qtlogo[i+1], qtlogo[i+2]));
        var n1 = new THREE.Vector3(qtlogo[i+3], qtlogo[i+4], qtlogo[i+5]);
        geom.vertices.push(new THREE.Vector3(qtlogo[i+6], qtlogo[i+7], qtlogo[i+8]));
        var n2 = new THREE.Vector3(qtlogo[i+9], qtlogo[i+10], qtlogo[i+11]);
        geom.vertices.push(new THREE.Vector3(qtlogo[i+12], qtlogo[i+13], qtlogo[i+14]));
        var n3 = new THREE.Vector3(qtlogo[i+15], qtlogo[i+16], qtlogo[i+17]);
        geom.faces.push(new THREE.Face3(idx, idx+1, idx+2, [n1, n2, n3]));
        idx += 3;
    }
    return geom;
};

var setupScene = function () {
    setupCheckerboard();
    var geom = new THREE.PlaneGeometry(4, 4);
    var material = new THREE.MeshPhongMaterial({ ambient: 0x060606,
                                                 color: 0x40B000,
                                                 specular: 0x03AA00,
                                                 shininess: 10,
                                                 map: cbTexture });
    cb = new THREE.Mesh(geom, material);
    scene.add(cb);

    geom = generateLogo();
    material = new THREE.MeshPhongMaterial({ ambient: 0x060606,
                                             color: 0x40B000,
                                             specular: 0x03AA00,
                                             shininess: 10 });
    logo = new THREE.Mesh(geom, material);
    logo.position.z = 2;
    logo.rotation.x = Math.PI;
    scene.add(logo);

    spotlight = new THREE.SpotLight(0xFFFFFF);
    spotlight.position.set(0, 0, 3);
    scene.add(spotlight);

    camera.position.z = 4;
};

var render = function () {
    requestAnimationFrame(render);
    TWEEN.update();
    renderCheckerboard();
    renderer.render(scene, camera);
    logo.rotation.y += 0.01;
};

var pointerState = {
    x: 0,
    y: 0,
    active: false,
    touchId: 0
};

var onMouseDown = function (e) {
    if (pointerState.active)
        return;

    if (e.changedTouches) {
        var t = e.changedTouches[0];
        pointerState.touchId = t.identifier;
        pointerState.x = t.clientX;
        pointerState.y = t.clientY;
    } else {
        pointerState.x = e.clientX;
        pointerState.y = e.clientY;
    }
    pointerState.active = true;
    e.preventDefault();
};

var onMouseUp = function (e) {
    if (!pointerState.active)
        return;

    if (e.changedTouches) {
        for (var i = 0; i < e.changedTouches.length; ++i)
            if (e.changedTouches[i].identifier == pointerState.touchId) {
                pointerState.active = false;
                break;
            }
    } else {
        pointerState.active = false;
    }
    e.preventDefault();
};

var onMouseMove = function (e) {
    if (!pointerState.active)
        return;

    var x, y;
    if (e.changedTouches) {
        for (var i = 0; i < e.changedTouches.length; ++i)
            if (e.changedTouches[i].identifier == pointerState.touchId) {
                x = e.changedTouches[i].clientX;
                y = e.changedTouches[i].clientY;
                break;
            }
    } else {
        x = e.clientX;
        y = e.clientY;
    }

    var dx = x - pointerState.x;
    var dy = y - pointerState.y;
    pointerState.x = x;
    pointerState.y = y;
    dx /= 100;
    dy /= -100;
    spotlight.target.position.set(spotlight.target.position.x + dx,
                                  spotlight.target.position.y + dy,
                                  0);
    e.preventDefault();
};

var main = function () {
    container.appendChild(renderer.domElement);
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("touchstart", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onMouseUp);
    window.addEventListener("touchcancel", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onMouseMove);
    setupScene();
    new TWEEN.Tween({ xrot: 0 })
        .to({ xrot: Math.PI / 3 }, 5000)
        .repeat(Infinity)
        .yoyo(true)
        .easing(TWEEN.Easing.Elastic.InOut)
        .onUpdate(function () {
            cb.rotation.x = -this.xrot;
        })
        .start();
    render();
};

main();
