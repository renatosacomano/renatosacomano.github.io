//2D vector class
class vec2{
    constructor(x,y,a =0,s=0){
        this.x = x;
        this.y = y;
        this.a = a;
        this.s = s;
    }

    isValid(){
        return !(isNaN(this.x) || isNaN(this.y) || isNaN(this.a) || isNaN(this.s))
    }
}

//simple gaussian function to interpolate between the key vectors
function gaussian(x,offset,fac){
    let xx = (x-offset);
    xx*=xx;
    return Math.exp(-(xx/fac))
}

//simple directional force vector, to pull the vector field in that direction.
class directionalForce{
    constructor(posx,posy,angle,force){
        this.pos = new vec2(posx,posy);
        this.force = svec(angle,force);
    }

    getInfluenceAt(x,y){
        let ix = gaussian(x,this.pos.x,this.force.s*100.0)
        let iy = gaussian(y,this.pos.y,this.force.s*100.0)

        return ix * iy;
    }

    isValid(){
        return this.pos.isValid() && this.force.isValid();
    }

}

//draws the vector into a canvas context '2D'
function drawVec(ctx,v,sz = 2.0){
    let n = normalize(normal(v));
    n.x*=sz;
    n.y*=sz;
    let a = sumVec(n,v);
    let b = normalize(v);

    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(v.x,v.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(v.x,v.y);
    ctx.lineTo(a.x,a.y);
    ctx.lineTo(v.x+b.x*sz*1.75,v.y+b.y*sz*1.75);
    ctx.lineTo(v.x-n.x,v.y-n.y);
    ctx.fill();
    ctx.stroke();
}

//converts degree to radians
function radians(degree){
    return degree*Math.PI/180;
}

//creates a unit vector with angle a in radians
function nvec(a){
    let sina = Math.sin(a);
    let cosa = Math.cos(a);

    return new vec2(cosa,sina)
}

//creates a vector with angle a in radians scaled by a scale factor, the new vector will have module equal to scale
function svec(a,scale){
    return new vec2(Math.cos(a)*scale,Math.sin(a)*scale,a,scale);
}

//sums up two vectors
function sumVec(va,vb){
    return new vec2(va.x+vb.x,va.y+vb.y)
}

//Gets the perpendicular vector relative to a vector
function normal(v){
    return new vec2(-v.y,v.x)
}

//Calculates the module of a vector
function module(v){
    if (v.x == 0 || v.y == 0){
        return Math.max(v.x,v.y);
    }

    return Math.sqrt(v.x*v.x + v.y*v.y)
}

//Calculates the distance between two vectors
function distance(a,b){
    let dx = b.x-a.x;
    let dy = b.y-a.y;
    return Math.sqrt(dx*dx + dy*dy);
}

//Return a normalized vector of a vector, and then scale it by a scale factor for simplicity.
function normalize(v,scale = 1){
    let mdl = module(v);
    return new vec2((v.x/mdl)*scale,(v.y/mdl)*scale)
}

//A 2D matrix representing a transformation of a 2D vector
class mat2{
    constructor(x1,y1,x2,y2){
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
    }
}

//Applies a transform Matrix 2D to a 2D Vector
function transform(v,m){
    return new vec2(v.x*m.x1 + v.y*m.y1,v.x*m.x2+v.y*m.y2);
}

//gets a rotated version of a vector by an angle in radians
function rotatedVec(v,a){
    let sina = Math.sin(a);
    let cosa = Math.cos(a);
    return new vec2(v.x*cosa-v.y*sina, v.x*sina+v.y*cosa)
}

//Returns a color in format "#RRGGBB" based on the temperature, 0 is blue, 1 is red, 0.5 is gray;
function colorTemperature(t){
    r = Math.floor(t*255)
    g = Math.floor((t*128 + (1-t)*128))
    b = Math.floor((1-t)*255)

    return '#'+r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0') +'55'
}

//Returns the linear interpolation between two values
function lerp(a,b,f){return a+(b-a)*f}


//Returns the angular linear interpolation between two angles
function aLerp(a,b,f){
    var max = Math.PI*2.0;
    var d = (b-a) % max;

    return a + (2*d % max - d) *f;
}

//Draws a directional force into the canvas context 2D
function drawForce(ctx,f,sz = 4.0,normalized = false,scale = 30,style = "#88FF88"){
    ctx.strokeStyle = style
    ctx.fillStyle = style
    ctx.setTransform(1,0,0,-1,f.pos.x,f.pos.y)
    if (normalized){
        drawVec(ctx,normalize(f.force,scale),sz);
        return;
    }
    drawVec(ctx,f.force,sz);
}

//Generates and calculates a vector field influenced by directional key forces using gaussian interpolation.
class vectorField{
    constructor(canvas,ctx){
        this.cv = canvas;
        this.ctx = ctx;
        this.keyVectors = [];
        this.flowVector = svec(0,1);
    }

    getVectorAt(x,y,scaled = 1){
        let ang = this.flowVector.a;
        for(let k = 0; k<this.keyVectors.length;k++){
            let inf = this.keyVectors[k].getInfluenceAt(x,y);
            ang = aLerp(ang,this.keyVectors[k].force.a,inf/this.flowVector.s);
        }

        return svec(ang,scaled);
    }

    getNearest(x,y){
        let md = 100000;
        let r = null
        for(let i = 0; i<this.keyVectors.length;i++){
            let k = this.keyVectors[i];
            let v = new vec2(x-k.pos.x,y-k.pos.y);
            let tmd = module(v);
            
            if (tmd < md){
                md = tmd;
                r = k;
            }
        }

        return r;
    }

    render(w,h){
        ctx.strokeStyle = "#AAAAAA"
        ctx.fillStyle = "#AAAAAA"

        for(let i = 0; i < this.cv.width+w;i+=w){
            for(let j = 0; j < this.cv.height+h; j+=h){

                let vi = 0;
                let ang = this.flowVector.a;

                for(let k = 0; k<this.keyVectors.length;k++){
                    let inf = this.keyVectors[k].getInfluenceAt(i,j);
                    ang = aLerp(ang,this.keyVectors[k].force.a,inf/this.flowVector.s);
                    vi+= inf;
                }
               
                let col = colorTemperature(vi)

                this.ctx.fillStyle = col;
                this.ctx.strokeStyle = col;

                let vec = svec(ang,w/3);

                this.ctx.setTransform(1,0,0,-1,i,j);
                drawVec(this.ctx,vec,3);
            }
        }
    }

    addForce(vec){
        if(vec.isValid()){
            this.keyVectors.push(vec);
        }
    }
}


//APP BEGIN

const cv = document.getElementById('cv')
const ctx = cv.getContext('2d');
const vfield = new vectorField(cv,ctx);
const info = document.getElementById('info')
const chknorma = document.getElementById('normaChk');
const ref_bt = document.getElementById('ref_bt')
const flow_bt = document.getElementById('flow_bt')
const samples = document.getElementById('samples')
const selsample = document.getElementById('selsample')
let flowvecs = []

ctx.fillStyle = "#343434"
ctx.fillRect(0,0,cv.width,cv.height);

let state = 'putkey'
let config = {
    draw_normalized:true
}

chknorma.checked = true;

function chknorma_chg(ev){
    config['draw_normalized'] = chknorma.checked;
}

chknorma.addEventListener('change',chknorma_chg);

function ref_mode(){
    state = 'putkey'
    info.innerHTML = 'Force Mode: Draw on the canvas to create force vectors to influence the stream.'
    ref_bt.style.color = "#FF0000"
    flow_bt.style.color = "#000000"
}

function flow_mode(){
    state = 'putflow'
    info.innerHTML = 'Boat Mode: Click anywhere on the canvas to create vectors that folow the stream.'
    ref_bt.style.color = "#000000"
    flow_bt.style.color = "#FF0000"
}

function clear_all(){
    vfield.keyVectors = []
    flowvecs = []
}

samples.value = '---- Sample 1 ----'

function SampleChoose(e){
    vfield.keyVectors = []
        if(!samples_conserve_boats){flowvecs = []}
    if(e == 'Sample 1'){
        sample1();
    }

    if(e == 'Sample 2'){
        sample2();
    }

    if(e == 'Sample 3'){
        sample3()
    }
    selsample.innerHTML = '---- ' + e +' ----';
    samples.value = '---- ' + e +' ----';
}

function clear_screen(){
    ctx.setTransform()
    ctx.fillStyle = "#003488";
    ctx.fillRect(0,0,cv.width,cv.height);
}

function pingpong(v){
    return Math.sin(v)
}

function deltat(n){
    delta +=n;
}

function pingpong(t,v){
    return ((Math.cos(Math.PI + t*2.0*Math.PI) + 1.0)/2.0)*v;
}

const boat = document.getElementById('boat')

function drawBoat(ctx,f){
    ctx.setTransform(1,0,0,1,-32,-16);
    ctx.drawImage(boat,f.pos.x,f.pos.y,64,32);
}

function flow(){
    clear_screen();
    vfield.render(30,30);

    vfield.keyVectors.forEach(el=>{
        drawForce(ctx,el,4,config['draw_normalized']);
    })

    flowvecs.forEach(el => {
        if(el != null)
        el.force = vfield.getVectorAt(el.pos.x,el.pos.y);
        el.pos.x += el.force.x;
        el.pos.y -= el.force.y;
        el.force.x *= 20;
        el.force.y *= 20;
        //drawForce(ctx,el,4.0,false,30,"#FFFFFF");
        drawBoat(ctx,el);

        el.pos.x %= cv.width;
        el.pos.y %= cv.height;

        if(el.pos.y < 0){
          el.pos.y = cv.height;   
        }

        if (el.pos.x < 0){
            el.pos.x = cv.width;
        }
    });
    
    samples_conserve_boats = flowvecs.length > 0;
    
    
}

let playfield = setInterval(flow,33);

let delta = 0;



let f_pos = null

function mouseup(ev){
    let bds = ev.target.getBoundingClientRect();
    let px = ev.clientX - bds.left;
    let py = ev.clientY - bds.top;
    if (state == 'putflow'){
        flowvecs.push(new directionalForce(px,py,0,10))
    }

    if(state == 'putkey'){
        let vc = new vec2((px-f_pos.x),(f_pos.y-py))
        let sc = module(vc);

        var a;
        if (vc.y > 0){
           a = Math.acos(vc.x/sc);
        }else{
            a = 2*Math.PI-Math.acos(vc.x/sc);
        }

        vfield.addForce(new directionalForce(f_pos.x,f_pos.y,a,sc));

        f_pos = null;
        playfield = setInterval(flow,33);
    }
}

function mousedown(ev){
    let bds = ev.target.getBoundingClientRect();
    let px = ev.x - bds.left;
    let py = ev.y - bds.top;

    if(state == 'putkey'){
        f_pos = new vec2(px,py);
        clearInterval(playfield);
    }
}

function mousemove(ev){
    if(state == 'putkey' && f_pos != null){
        let bds = ev.target.getBoundingClientRect();
        let px = ev.x - bds.left;
        let py = ev.y - bds.top;

        let v = new vec2(px-f_pos.x,f_pos.y-py);
        flow()
        ctx.setTransform(1,0,0,-1,f_pos.x,f_pos.y);
        ctx.fillStyle = "#88FF88"
        ctx.strokeStyle = "#88FF88"
        drawVec(ctx,v,4);
    }
}

cv.addEventListener('pointerup',mouseup)
cv.addEventListener('pointerdown',mousedown)
cv.addEventListener('pointermove',mousemove)

const MainAngleRange = document.getElementById('mainforce')

function MainAngleConv(a){

    if(Number(a) < 0){
        return 360+Number(a);
    }
    
    return Number(a);
     
}

MainAngleRange.addEventListener('input',(ev)=>{
    
    vfield.flowVector = svec(radians(MainAngleConv(MainAngleRange.value)),1);
    
})


let samples_conserve_boats = false

function sample1(){
    vfield.addForce(new directionalForce(300,200,radians(45),200))
    vfield.addForce(new directionalForce(500,200,radians(315),200))
    vfield.addForce(new directionalForce(500,400,radians(225),200))
    vfield.addForce(new directionalForce(300,400,radians(135),200))

    if (!samples_conserve_boats){
        flowvecs.push(new directionalForce(300,400,0,10))
        flowvecs.push(new directionalForce(300,200,0,10))
        flowvecs.push(new directionalForce(500,200,0,10))
        flowvecs.push(new directionalForce(500,400,0,10))
    }
}

function sample2(){
    
    for(let k = 1; k<15;k++){
        for(let i = 0;i<360;i+=60){
            let ang = (i+k*15)%360
            let xd = Math.cos(radians(ang))
            let yd = Math.sin(radians(ang))

            vfield.addForce(new directionalForce(400+xd*(20*k),300+yd*(-20*k),radians(ang),75))      
        }
    }

    if(!samples_conserve_boats){
        flowvecs.push(new directionalForce(350,250,0,10))
        flowvecs.push(new directionalForce(350,350,0,10))
        flowvecs.push(new directionalForce(450,350,0,10))
        flowvecs.push(new directionalForce(450,250,0,10))
    }
   
}

function sample3(){
    for(let k = 1; k<15;k++){
        for(let i = 0;i<360;i+=60){
            let ang = (i+k*15)%360
            let xd = Math.cos(radians(ang))
            let yd = Math.sin(radians(ang))

            ang = (ang+180)%360;

            vfield.addForce(new directionalForce(400+xd*(20*k),300+yd*(-20*k),radians(ang),75))      
        }
    }

    if(!samples_conserve_boats){
        flowvecs.push(new directionalForce(100,100,0,10))
        flowvecs.push(new directionalForce(100,500,0,10))
        flowvecs.push(new directionalForce(700,500,0,10))
        flowvecs.push(new directionalForce(700,100,0,10))
    }
}

sample1() 
vfield.render(40,40);





