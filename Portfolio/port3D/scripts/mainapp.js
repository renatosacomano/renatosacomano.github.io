const loader = new THREE.GLTFLoader();
const envloader = new THREE.EXRLoader();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30,800/600,0.1,1000);

const renderer = new THREE.WebGLRenderer({alpha:true});
//renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(800,600);
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setClearColor(0x000000,0)


const cvHolder = document.getElementById('cvHolder');
cvHolder.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1,1,1);

const material = new THREE.MeshBasicMaterial({color:0x00ff00});
const cube = new THREE.Mesh(geometry,material);


function texLoader(tex){
    tex.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = tex;

    if(rotanim == false){
        renderer.render(scene,camera);
    }
}



const controls = new THREE.OrbitControls(camera,renderer.domElement);


//camera.position.z = 15;
//camera.position.y = 1;
//controls.target.y = 1;

controls.update();

function adjust_camera(x,y,z){
    camera.position.set(x,y,z);
    controls.target.set(x,y,0);
}

adjust_camera(0.5,1,15);

const outlinefx = new THREE.OutlineEffect(renderer);

const amblight = new THREE.AmbientLight(0x000000,1.0)

let rotanim = false;
let ang = 0;
let obj = null;

function anim(){
    if (rotanim && obj != null){
        requestAnimationFrame(anim);
        ang += Math.PI/180;
        obj.rotateY(0.01);
        renderer.render(scene,camera);
    }

}

class modelConf{
    constructor(name,x,y,z){
        this.name = name;
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

function model(name,x,y,z){
    return new modelConf(name,x,y,z);
}

let modelList = [model('Soda.gltf',0,0,35),model('beetle.gltf',0,-0.5,15),model('crow.gltf',0.5,1,15),model('LowPoly.gltf',0,-0.5,6),model('Vaso.gltf',0,0.5,5)];

let model_transform = model('none',0,0,0);

function loadModel(gltf){
    if (obj != null){
        scene.remove(obj);
        obj = null;
    }

    gltf.scene.children[0].name = 'obj'
    obj = gltf.scene.children[0]
    scene.add(gltf.scene.children[0]); 
    
    renderer.render(scene,camera);
    if (rotanim == false){
        rotanim = true;
        anim();
    }

    adjust_camera(model_transform.x,model_transform.y,model_transform.z)
    controls.update();
}

function err(error){
    let errel = document.getElementById('err');
    errel.style.display = "block";
    errel.innerHTML += '<br>'
    errel.innerText += '--< '+ error.toString() + ' >--'
}

let current_model = -1

function loadNext(reverse = false){
    rotanim = false;
    
    if(reverse){
        current_model--;
        if(current_model <0){
            current_model = modelList.length-1;
        }
    }else{
        current_model = (current_model + 1) % modelList.length;
    }
    
    let next = modelList[current_model];
    model_transform = next;
    loader.load('scenes/'+next.name,loadModel,undefined,err);   
}

loadNext()

function loadEnv(env){
    envloader.load('texturas/'+ env,texLoader,undefined,err);

}

loadEnv('cellar.exr');


renderer.domElement.addEventListener('pointerdown',ev=>{
    rotanim = false;
})
    

controls.addEventListener('change',function(){
    renderer.render(scene,camera);
})