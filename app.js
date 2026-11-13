
(function(){
'use strict';
var c=document.getElementById('c'), ctx=c.getContext('2d');
var mech='fourbar', paused=false, t=0, spd=1;
var tracePts=[], MAX_PTS=500, lang='en', dark=true;
var $=function(id){return document.getElementById(id)};
var cs=function(){return getComputedStyle(document.documentElement)};
function gc(n){return cs().getPropertyValue('--'+n).trim()}

function showRuntimeError(message){
  if(!c.parentElement||c.parentElement.querySelector('.runtime-message'))return;
  var panel=document.createElement('div');
  panel.className='runtime-message';
  panel.textContent='Simulator failed to start: '+message;
  c.parentElement.appendChild(panel);
}
window.addEventListener('error',function(e){
  // Ignore opaque "Script error" events from browser extensions or other
  // cross-origin scripts; they do not identify a failure in this app.
  if(e.target===window&&e.filename&&e.filename.indexOf('app.js')!==-1)
    showRuntimeError(e.message||'Unknown JavaScript error');
});

var col={};
function updateCol(){col={fix:gc('fixed'),drv:gc('driver'),out:gc('output'),trc:(gc('trace')||'#f1c40f'),mut:gc('muted')}; if(!col.trc)col.trc='#f1c40f';}

var T={
  en:{fourbar:'Four-Bar',geneva:'Geneva Drive',scotch:'Scotch Yoke',planetary:'Planetary',
      pb:'Playback',spd:'Speed multiplier',pause:'Pause',resume:'Resume',reset:'Reset',
      viz:'Visualization',trc:'Trace',vec:'Vectors',lbl:'Labels',clr:'Clear Trace',
      params:'Parameters',desc:'Description',legend:'Legend',drv:'Driver',out:'Output',fix:'Fixed'},
  bg:{fourbar:'Четиризвенен механизъм',geneva:'Женевско колело',scotch:'Кулисен механизъм',planetary:'Планетарна предавка',
      pb:'Управление',spd:'Коефициент на скоростта',pause:'Пауза',resume:'Продължи',reset:'Нулиране',
      viz:'Визуализация',trc:'Следене',vec:'Вектори',lbl:'Етикети',clr:'Изчисти',
      params:'Параметри',desc:'Описание',legend:'Легенда',drv:'Задвижващо',out:'Изходно',fix:'Фиксирана'}
};
var DESC={
  fourbar:{en:'Closed-loop planar mechanism with four rigid links connected by revolute joints.',bg:'Механизъм с четири звена, свързани с ротационни стави.'},
  geneva:{en:'Converts continuous rotation into intermittent rotary motion via slotted wheel.',bg:'Преобразува непрекъснато въртене в периодично движение чрез жлебово колело.'},
  scotch:{en:'Transforms rotary motion into pure linear sinusoidal motion.',bg:'Трансформира ротационното движение в линейно синусоидно.'},
  planetary:{en:'Epicyclic gear train: sun gear drives planet gears inside an outer ring gear.',bg:'Епициклична предавка: слънчево колело задвижва планети в пръстен.'}
};

var state={
  fourbar:{L1:160,L2:65,L3:155,L4:115},
  geneva:{pd:110,n:4},
  scotch:{r:55,w:140},
  planetary:{sr:42,pr:20,np:3}
};

function resize(){
  var container = c.parentElement;
  if(container){
    var r = container.getBoundingClientRect();
    if(r.width > 0 && r.height > 0){
      var width=Math.round(r.width),height=Math.round(r.height);
      // Assigning canvas dimensions clears it, so only resize when the layout changes.
      if(c.width!==width||c.height!==height){c.width=width;c.height=height}
    }
  }
}
window.addEventListener('resize',resize);
resize();

function h2r(h){if(!h)return null;var m=h.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:null}
function tint(c,d){return'rgb('+Math.max(0,Math.min(255,c.r+d))+','+Math.max(0,Math.min(255,c.g+d))+','+Math.max(0,Math.min(255,c.b+d))+')'}
function bright(c,a){return tint(c,a)}
function R(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

function bar(x1,y1,x2,y2,w,col){
  var a=Math.atan2(y2-y1,x2-x1),hw=w/2;
  ctx.save();
  ctx.globalAlpha=.2;ctx.strokeStyle='#000';ctx.lineWidth=w+2;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x1+2,y1+3);ctx.lineTo(x2+2,y2+3);ctx.stroke();
  ctx.globalAlpha=1;
  ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.globalAlpha=.25;ctx.strokeStyle='#fff';ctx.lineWidth=w*.25;
  ctx.beginPath();ctx.moveTo(x1-Math.sin(a)*hw*.4,y1+Math.cos(a)*hw*.4);ctx.lineTo(x2-Math.sin(a)*hw*.4,y2+Math.cos(a)*hw*.4);ctx.stroke();
  ctx.restore();
}

function joint(x,y,r,col,fixed){
  var g=ctx.createRadialGradient(x-r*.35,y-r*.35,0,x,y,r),cr=h2r(col)||{r:200,g:200,b:200};
  g.addColorStop(0,bright(cr,70));g.addColorStop(.6,col);g.addColorStop(1,tint(cr,-60));
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle=fixed?'#111':tint(cr,-40);ctx.beginPath();ctx.arc(x,y,r*.35,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.4;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-r*.25,y-r*.25,r*.18,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
}

function ground(x1,y1,x2,y2){
  var dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy);if(len===0)return;
  var nx=-dy/len,ny=dx/len,sp=7,c=h2r(col.fix)||{r:85,g:85,b:85};
  ctx.strokeStyle=tint(c,-15);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.strokeStyle=tint(c,20);ctx.lineWidth=1;
  for(var d=-len/2;d<=len/2;d+=sp){
    var px=x1+(dx===0?0:(dx/len)*(d+len/2)),py=y1+(dy/len)*(d+len/2);
    ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+nx*8,py+ny*8);ctx.stroke();
  }
}

function arr(x1,y1,x2,y2,col){
  var h=9,a=Math.atan2(y2-y1,x2-x1);
  ctx.strokeStyle=col;ctx.lineWidth=2;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-h*Math.cos(a-.35),y2-h*Math.sin(a-.35));
  ctx.moveTo(x2,y2);ctx.lineTo(x2-h*Math.cos(a+.35),y2-h*Math.sin(a+.35));ctx.stroke();
}

function txt(s,x,y,f,sz){
  ctx.fillStyle=f||col.mut;ctx.font=(sz||10)+'px '+getComputedStyle(document.body).fontFamily;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y);
}

function block(cx,cy,w,h,col,alpha){
  ctx.save();ctx.globalAlpha=alpha||.85;
  var cr=h2r(col)||{r:100,g:100,b:100},g=ctx.createLinearGradient(cx-w/2,cy-h/2,cx+w/2,cy+h/2);
  g.addColorStop(0,bright(cr,40));g.addColorStop(.5,col);g.addColorStop(1,tint(cr,-50));
  ctx.fillStyle=g;R(ctx,cx-w/2,cy-h/2,w,h,3);ctx.fill();
  ctx.strokeStyle=tint(cr,-70);ctx.lineWidth=1.5;R(ctx,cx-w/2,cy-h/2,w,h,3);ctx.stroke();
  ctx.restore();
}

function drawGear(cx,cy,R,N,rot,col){
  // Use a shared tooth module so gears with different radii mesh at their
  // pitch circles instead of having oversized, colliding teeth.
  var module=2*R/N, Ra=R+module, Rr=R-module*1.25;
  var pitch=(Math.PI*2)/N, half=pitch*0.25;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.beginPath();
  for(var i=0;i<N;i++){
    var a=i*pitch;
    ctx.arc(0,0,Rr,a,a+half,false);
    ctx.lineTo(Ra*Math.cos(a+half*1.4),Ra*Math.sin(a+half*1.4));
    ctx.arc(0,0,Ra,a+half*1.4,a+pitch-half*1.4,false);
    ctx.lineTo(Rr*Math.cos(a+pitch),Rr*Math.sin(a+pitch));
  }
  ctx.closePath();
  var cr=h2r(col)||{r:46,g:204,b:113},g=ctx.createRadialGradient(-R*.3,-R*.3,0,0,0,Ra);
  g.addColorStop(0,bright(cr,60));g.addColorStop(.6,col);g.addColorStop(1,tint(cr,-65));
  ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=tint(cr,-80);ctx.lineWidth=1.5;ctx.stroke();
  if(N>=8){
    var numH=Math.min(N-4,5),hr=R*.15,dist=R*.5;
    for(var h=0;h<numH;h++){
      var ha=(h/numH)*Math.PI*2;
      ctx.beginPath();ctx.arc(dist*Math.cos(ha),dist*Math.sin(ha),hr,0,Math.PI*2);
      ctx.fillStyle='rgba(0,0,0,.45)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1;ctx.stroke();
    }
  }
  ctx.beginPath();ctx.arc(0,0,R*.22,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();
  ctx.strokeStyle=tint(cr,-40);ctx.lineWidth=1.5;ctx.stroke();
  ctx.restore();
}

function drawGenevaWheel(cx,cy,R,n,rot,col){
  var cr=h2r(col)||{r:46,g:204,b:113};
  var g=ctx.createRadialGradient(cx-R*.3,cy-R*.3,0,cx,cy,R);
  g.addColorStop(0,bright(cr,55));g.addColorStop(.65,col);g.addColorStop(1,tint(cr,-65));
  ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);
  // Four broad cross arms and radial slots, matching the four-stop reference.
  for(var i=0;i<n;i++){
    var a=i*Math.PI*2/n;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*R*.82,Math.sin(a)*R*.82);
    ctx.strokeStyle=col;ctx.lineWidth=R*.46;ctx.lineCap='round';ctx.stroke();
    ctx.beginPath();ctx.arc(Math.cos(a)*R*.82,Math.sin(a)*R*.82,R*.23,0,Math.PI*2);
    ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=tint(cr,-75);ctx.lineWidth=1.5;ctx.stroke();
  }
  ctx.beginPath();ctx.arc(0,0,R*.3,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
  ctx.strokeStyle=tint(cr,-75);ctx.lineWidth=1.5;ctx.stroke();
  for(var j=0;j<n;j++){
    var sa=j*Math.PI*2/n;
    ctx.beginPath();ctx.moveTo(Math.cos(sa)*R*.27,Math.sin(sa)*R*.27);
    ctx.lineTo(Math.cos(sa)*R*.99,Math.sin(sa)*R*.99);
    ctx.strokeStyle='rgba(10,12,15,.86)';ctx.lineWidth=Math.max(6,R*.12);ctx.lineCap='round';ctx.stroke();
    ctx.beginPath();ctx.moveTo(Math.cos(sa)*R*.32,Math.sin(sa)*R*.32);
    ctx.lineTo(Math.cos(sa)*R*.94,Math.sin(sa)*R*.94);
    ctx.strokeStyle='rgba(210,230,220,.28)';ctx.lineWidth=1;ctx.stroke();
  }
  ctx.beginPath();ctx.arc(0,0,R*.115,0,Math.PI*2);ctx.fillStyle='#15171b';ctx.fill();
  ctx.strokeStyle=tint(cr,-40);ctx.lineWidth=2;ctx.stroke();
  ctx.restore();
}

function drawRingGear(cx,cy,R,N,col){
  var module=2*R/N, Rtip=R-module, Rroot=R+module*1.25, Rout=R+module*4;
  var pitch=(Math.PI*2)/N, half=pitch*0.25;
  ctx.save();ctx.translate(cx,cy);ctx.beginPath();
  ctx.arc(0,0,Rout,0,Math.PI*2,false);
  ctx.moveTo(Rroot,0);
  for(var i=0;i<N;i++){
    var a=i*pitch;
    ctx.arc(0,0,Rroot,a,a+half,false);
    ctx.lineTo(Rtip*Math.cos(a+half*1.4),Rtip*Math.sin(a+half*1.4));
    ctx.arc(0,0,Rtip,a+half*1.4,a+pitch-half*1.4,false);
    ctx.lineTo(Rroot*Math.cos(a+pitch),Rroot*Math.sin(a+pitch));
  }
  ctx.closePath();
  var cr=h2r(col)||{r:46,g:204,b:113},g=ctx.createRadialGradient(-R*.2,-R*.2,R*.8,0,0,Rout);
  g.addColorStop(0,bright(cr,40));g.addColorStop(.7,col);g.addColorStop(1,tint(cr,-50));
  ctx.fillStyle=g;ctx.fill('evenodd');ctx.strokeStyle=tint(cr,-70);ctx.lineWidth=1.5;ctx.stroke();
  for(var b=0;b<6;b++){
    var ba=(b/6)*Math.PI*2+Math.PI/12, bx=Math.cos(ba)*(Rroot+Rout)*.5, by=Math.sin(ba)*(Rroot+Rout)*.5;
    ctx.beginPath();ctx.arc(bx,by,3,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.5)';ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1;ctx.stroke();
  }
  ctx.restore();
}

// ─── MECHANISM DRAW FUNCTIONS ──────────────────────

function drawFourBar(){
  var L1=state.fourbar.L1,L2=state.fourbar.L2,L3=state.fourbar.L3,L4=state.fourbar.L4;
  var ang=t,Ax=-L1/2,Ay=45,Dx=L1/2,Dy=45;
  var Bx=Ax+L2*Math.cos(ang),By=Ay+L2*Math.sin(ang);
  var dBD=Math.hypot(Dx-Bx,Dy-By);
  if(dBD<0.001){txt(lang==='bg'?'Звенова сингулярност':'Link singularity',0,0,'#ff5252');return}
  var cosA=(L4*L4+dBD*dBD-L3*L3)/(2*L4*dBD);
  if(Math.abs(cosA)>1){txt(lang==='bg'?'Невалидна геометрия':'Invalid Geometry',0,0,'#ff5252');return}
  var alpha=Math.acos(cosA),angBD=Math.atan2(By-Dy,Bx-Dx);
  var Cx=Dx+L4*Math.cos(angBD+alpha),Cy=Dy+L4*Math.sin(angBD+alpha);

  ground(Ax-25,Ay,Dx+25,Dy);
  bar(Ax,Ay,Dx,Dy,9,col.fix);                           // fixed link (ground)
  joint(Ax,Ay,7,col.fix,true); joint(Dx,Dy,7,col.fix,true);
  bar(Ax,Ay,Bx,By,11,col.drv);                          // driver (crank)
  joint(Bx,By,6,col.drv,false);
  bar(Bx,By,Cx,Cy,9,col.out);                           // coupler
  joint(Cx,Cy,6,col.out,false);
  bar(Dx,Dy,Cx,Cy,9,col.out);                           // rocker (output)

  if(traceChk.checked){
    tracePts.push({x:Cx,y:Cy});if(tracePts.length>MAX_PTS)tracePts.shift();
    if(tracePts.length>1){
      ctx.strokeStyle=col.trc;ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();
      ctx.moveTo(tracePts[0].x,tracePts[0].y);
      for(var i=1;i<tracePts.length;i++)ctx.lineTo(tracePts[i].x,tracePts[i].y);
      ctx.stroke();ctx.setLineDash([]);
    }
  }

  if(lblChk.checked){if(lang==='bg'){
txt('A',Ax,Ay-16,col.drv,11);txt('B',Bx,By-16,col.drv,11);txt('C',Cx,Cy-16,col.out,11);txt('D',Dx,Dy-16,col.fix,11);
} else {txt('A',Ax,Ay-16,col.drv,11);txt('B',Bx,By-16,col.drv,11);txt('C',Cx,Cy-16,col.out,11);txt('D',Dx,Dy-16,col.fix,11);}
  }
  if(vecChk.checked){var vx=-L2*Math.sin(ang)*.3,vy=L2*Math.cos(ang)*.3;arr(Bx,By,Bx+vx,By+vy,'#e74c3c')}
}

function drawGeneva(){
  var pd=state.geneva.pd,n=state.geneva.n;
  var step=Math.PI*2/n,alphaCrit=Math.PI/2-Math.PI/n;
  var r=pd*Math.sin(Math.PI/n),wheelR=pd*Math.cos(Math.PI/n);
  var phase=((t%(Math.PI*2))+Math.PI*2)%(Math.PI*2),cycle=Math.floor(t/(Math.PI*2));
  var Dx=-pd,Dy=0,alpha=phase,px=Dx+r*Math.cos(phase),py=r*Math.sin(phase);
  var wheelAngle;
  if(phase<=alphaCrit){
    wheelAngle=Math.atan2(py,px)-cycle*step;
  }else if(phase>=Math.PI*2-alphaCrit){
    var pinAngle=Math.atan2(py,px);if(pinAngle<0)pinAngle+=Math.PI*2;
    wheelAngle=pinAngle-(cycle+1)*step;
  }else{
    wheelAngle=Math.PI-alphaCrit-cycle*step;
  }
  drawGenevaWheel(0,0,wheelR,n,wheelAngle,col.out);

  ctx.save();ctx.translate(Dx,Dy);ctx.rotate(alpha);
  var driverR=pd*.42;
  var dg=ctx.createRadialGradient(-driverR*.3,-driverR*.3,0,0,0,driverR);
  dg.addColorStop(0,'#ddd');dg.addColorStop(.5,'#777');dg.addColorStop(1,'#333');
  ctx.fillStyle=dg;ctx.beginPath();ctx.arc(0,0,driverR,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#222';ctx.lineWidth=1.5;ctx.stroke();
  // Locking plate and crank pin make the intermittent drive visible.
  ctx.beginPath();ctx.arc(0,0,pd-wheelR*.92,alphaCrit,Math.PI*2-alphaCrit,false);
  ctx.strokeStyle=col.drv;ctx.lineWidth=5;ctx.stroke();
  bar(0,0,r,0,5,col.drv);
  ctx.shadowColor='#ffeb3b';ctx.shadowBlur=8;joint(r,0,5,'#ffeb3b',false);ctx.shadowBlur=0;
  ctx.restore();

  joint(Dx,Dy,6,col.fix,true);joint(0,0,7,col.fix,true);
  if(lblChk.checked){
    txt(lang==='bg'?'Задвижване':'Driver',Dx,Dy-driverR-16,col.drv,10);
    txt(lang==='bg'?'Женевско колело':'Geneva Wheel',0,-wheelR-18,col.out,10);
  }
}

function drawScotch(){
  var r=state.scotch.r, yw=state.scotch.w, ang=t;
  var cx=r*Math.cos(ang), cy=r*Math.sin(ang), yx=cx;

  var railY1=-yw/2-12, railY2=yw/2+12;
  bar(-r-40,railY1,r+180,railY1,6,col.fix);
  bar(-r-40,railY2,r+180,railY2,6,col.fix);

  var cg=ctx.createRadialGradient(-r*.3,-r*.3,0,0,0,r*1.1);
  cg.addColorStop(0,'#eee');cg.addColorStop(.5,'#777');cg.addColorStop(1,'#333');
  ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*1.05,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#222';ctx.lineWidth=1.5;ctx.stroke();
  joint(0,0,6,col.fix,true);

  bar(0,0,cx,cy,10,col.drv);

  var yokeW=24, slotW=14;
  ctx.save();ctx.translate(yx,0);
  ctx.beginPath();
  R(ctx,-yokeW/2,-yw/2-8,yokeW,yw+16,4);
  ctx.rect(slotW/2,-yw/2,-slotW,yw);
  ctx.closePath();
  var cr=h2r(col.out)||{r:46,g:204,b:113},yg=ctx.createLinearGradient(-yokeW/2,0,yokeW/2,0);
  yg.addColorStop(0,bright(cr,40));yg.addColorStop(.5,col.out);yg.addColorStop(1,tint(cr,-50));
  ctx.fillStyle=yg;ctx.fill('evenodd');
  ctx.strokeStyle=tint(cr,-70);ctx.lineWidth=1.5;ctx.stroke();
  ctx.restore();

  // Single output link + piston block
  bar(yx+yokeW/2,0,yx+130,0,10,col.out);
  block(yx+130,0,24,30,col.out,.9);
  joint(yx+130,0,8,col.out,false);

  ctx.shadowColor='#ffeb3b';ctx.shadowBlur=10;joint(cx,cy,7,'#ffeb3b',false);ctx.shadowBlur=0;

  if(traceChk.checked){
    tracePts.push({x:cx,y:cy});if(tracePts.length>MAX_PTS)tracePts.shift();
    if(tracePts.length>1){
      ctx.strokeStyle=col.trc;ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();
      ctx.moveTo(tracePts[0].x,tracePts[0].y);
      for(var i=1;i<tracePts.length;i++)ctx.lineTo(tracePts[i].x,tracePts[i].y);
      ctx.stroke();ctx.setLineDash([]);
    }
  }
  if(vecChk.checked){var vx=-r*Math.sin(ang)*.4;arr(cx,cy,cx+vx,cy,'#e74c3c')}
  if(lblChk.checked){
    txt(lang==='bg'?'Манивела':'Crank Pin',cx,cy-14,col.drv,10);
    txt(lang==='bg'?'Кулиса':'Yoke',yx,-yw/2-18,col.out,10);
    txt(lang==='bg'?'Бутало':'Piston',yx+130,22,col.out,10);
  }
}

function drawPlanetary(){
  var sr=state.planetary.sr, pr=state.planetary.pr, np=state.planetary.np;
  var ringR=sr+2*pr, carR=sr+pr;
  // With the ring fixed, the carrier and planet spin follow the Willis relation.
  var ca=t*sr/(sr+2*pr);
  var planetSpin=ca-(t-ca)*(sr/pr);
  var planetTeeth=10,sunTeeth=Math.round(planetTeeth*sr/pr),ringTeeth=sunTeeth+2*planetTeeth;

  drawRingGear(0,0,ringR,ringTeeth,col.out);
  drawGear(0,0,sr,sunTeeth,t,col.drv);
  // A radial mark makes the sun gear's rotation easy to see while it drives.
  ctx.save();ctx.rotate(t);ctx.strokeStyle='#ff9a8f';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(sr*.28,0);ctx.lineTo(sr*.78,0);ctx.stroke();ctx.restore();
  joint(0,0,6,col.fix,true);

  for(var i=0;i<np;i++){
    var pa=ca+(i/np)*Math.PI*2, px=carR*Math.cos(pa), py=carR*Math.sin(pa);
    // Relative planet spin is negative at the sun mesh; add carrier rotation
    // to obtain each planet's absolute spin in the fixed frame.
    ctx.strokeStyle='rgba(160,160,160,.35)';ctx.lineWidth=6;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(sr*Math.cos(pa),sr*Math.sin(pa));ctx.lineTo(px,py);ctx.stroke();
    drawGear(px,py,pr,planetTeeth,planetSpin,col.out);
    joint(px,py,4,'#aaa',false);
  }
  joint(0,0,7,col.drv,false);
  if(lblChk.checked){
    if(lang==='bg'){
      txt('Слънчево колело',0,sr+18,col.drv,10);
      txt('Водило',carR+16,0,col.drv,10);
      txt('Пръстен',ringR+18,0,col.out,10);
    } else {
      txt('Sun Gear',0,sr+18,col.drv,10);
      txt('Carrier',carR+16,0,col.drv,10);
      txt('Ring Gear',ringR+18,0,col.out,10);
    }
  }
}

// ─── MAIN LOOP ───
function loop(){
  resize();
  if(!c.width||!c.height){requestAnimationFrame(loop);return}
  ctx.clearRect(0,0,c.width,c.height);
  ctx.save();
  ctx.translate(c.width/2,c.height/2);
  var s=Math.min(c.width,c.height)/400;
  ctx.scale(s,s);
  if(mech==='fourbar')drawFourBar();
  else if(mech==='geneva')drawGeneva();
  else if(mech==='scotch')drawScotch();
  else drawPlanetary();
  ctx.restore();
  if(!paused)t+=.016*spd;
  requestAnimationFrame(loop);
}

// ─── EVENTS ───
$('themeToggle').onclick=function(){dark=!dark;document.documentElement.setAttribute('data-theme',dark?'':'light');$('themeToggle').textContent=dark?'🌙':'☀️';updateCol()};

function applyLang(l){
  lang=l;var tx=T[l];
  $('mainTitle').textContent=l==='en'?'Mechanical Mechanisms':'Механични механизми';
  $('playbackLabel').textContent=tx.pb;$('speedLabel').textContent=tx.spd;
  pauseBtn.textContent=paused?tx.resume:tx.pause;$('resetBtn').textContent=tx.reset;
  $('vizLabel').textContent=tx.viz;$('traceLbl').textContent=tx.trc;
  $('vecLbl').textContent=tx.vec;$('lblLbl').textContent=tx.lbl;
  $('clearBtn').textContent=tx.clr;$('paramsLabel').textContent=tx.params;
  $('descLabel').textContent=tx.desc;$('legendLabel').textContent=tx.legend;
  $('driverLbl').textContent=tx.drv;$('outputLbl').textContent=tx.out;
  $('fixedLbl').textContent=tx.fix;$('traceLbl2').textContent=tx.trc;
  $('descText').textContent=DESC[mech][l];$('langToggle').textContent=l==='en'?'EN':'BG';
  document.querySelectorAll('.tab-btn').forEach(function(tab){tab.textContent=tab.dataset[l]});
  buildParams();
}
$('langToggle').onclick=function(){applyLang(lang==='en'?'bg':'en');updateCol()};

document.querySelectorAll('.tab-btn').forEach(function(tab){
  tab.onclick=function(){
    document.querySelectorAll('.tab-btn').forEach(function(t){t.classList.remove('active')});
    this.classList.add('active');mech=this.dataset.mech;tracePts=[];
    $('descText').textContent=DESC[mech][lang];buildParams();closeSide();
  }
});

var pauseBtn=$('pauseBtn'),resetBtn=$('resetBtn'),speedSlider=$('speedSlider'),speedVal=$('speedVal');
var traceChk=$('traceChk'),vecChk=$('vecChk'),lblChk=$('lblChk'),clearBtn=$('clearBtn'),paramsGrp=$('paramsGroup');

pauseBtn.onclick=function(){paused=!paused;pauseBtn.textContent=paused?T[lang].resume:T[lang].pause;pauseBtn.classList.toggle('primary',!paused)};
resetBtn.onclick=function(){t=0;tracePts=[]};
speedSlider.oninput=function(){spd=parseFloat(speedSlider.value)/30;speedVal.textContent=spd.toFixed(1)+'×'};
clearBtn.onclick=function(){tracePts=[]};

var sb=$('sidebar'),ov=$('overlay');
function openSide(){if(sb && ov) {sb.classList.add('open');ov.classList.add('show')}}
function closeSide(){if(sb && ov) {sb.classList.remove('open');ov.classList.remove('show')}}
$('menuBtn').onclick=openSide;
$('closeBtn').onclick=closeSide;
$('overlay').onclick=closeSide;
var dcollapsed=false;
$('toggleBtn').onclick=function(){dcollapsed=!dcollapsed;if(sb) sb.classList.toggle('collapsed',dcollapsed);var t=$('toggleBtn');if(t) t.textContent=dcollapsed?'›':'‹'};

function buildParams(){
  paramsGrp.innerHTML='<h3>'+T[lang].params+'</h3>';
  var st=state[mech];
  var cfgs={
    fourbar:[['L1',st.L1,80,300,T[lang].fix],
             ['L2',st.L2,20,100,lang==='bg'?'Дължина на манивелата':'Crank Length'],
             ['L3',st.L3,100,250,lang==='bg'?'Дължина на свързващото звено':'Coupler Length'],
             ['L4',st.L4,50,200,lang==='bg'?'Дължина на люлеещото звено':'Rocker Length']],
    geneva:[['n',st.n,3,12,lang==='bg'?'Брой прорези':'Slot Count',1]],
    scotch:[['r',st.r,20,100,lang==='bg'?'Радиус на манивелата':'Crank Radius']],
    planetary:[['np',st.np,2,6,lang==='bg'?'Брой сателити':'Planet Count',1]]
  };
  (cfgs[mech]||[]).forEach(function(p){addSlider(p[0],p[1],p[2],p[3],p[4],p[5]||1)});
}

function addSlider(key,val,min,max,label,step){
  step=step||1;var row=document.createElement('div');row.className='slider-row';
  var labelEl=document.createElement('span');labelEl.textContent=label;
  var valEl=document.createElement('span');valEl.id='v-'+key;valEl.textContent=val;
  var lblDiv=document.createElement('div');lblDiv.className='slider-label';
  lblDiv.appendChild(labelEl);lblDiv.appendChild(valEl);
  var inp=document.createElement('input');inp.type='range';inp.min=min;inp.max=max;inp.value=val;inp.step=step;
  inp.oninput=function(e){state[mech][key]=parseFloat(e.target.value);$('v-'+key).textContent=e.target.value;tracePts=[]};
  row.appendChild(lblDiv);row.appendChild(inp);paramsGrp.appendChild(row);
}

try{
  updateCol();applyLang('en');buildParams();loop();
}catch(e){
  console.error('Mechanical Mechanisms startup failed:',e);
  showRuntimeError(e.message||String(e));
}
})();
