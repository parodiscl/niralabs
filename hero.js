/* ═══════════════════════════════════════════════════════
   NIRA LABS — Hero Experiment Engine
   21 backgrounds random: 6 videos + 15 canvas experiments
═══════════════════════════════════════════════════════ */
(function () {
  const CV = document.getElementById('heroCanvas');
  const VD = document.getElementById('heroVideo');
  const CT = CV.getContext('2d');
  let W, H;

  function resize() {
    W = CV.width  = CV.offsetWidth;
    H = CV.height = CV.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const TAU = Math.PI * 2;
  const rnd = Math.random;
  const ri  = n => Math.floor(rnd() * n);
  const rf  = (a, b) => a + rnd() * (b - a);
  const PAL = ['#00D4FF', '#A78BFA', '#F472B6', '#34D399'];
  const pc  = () => PAL[ri(PAL.length)];

  function h2r(h) {
    return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  }
  function rgba(col, a) {
    const [r,g,b] = h2r(col);
    return `rgba(${r},${g},${b},${a})`;
  }
  function fade(a = 0.1) {
    CT.fillStyle = `rgba(10,15,28,${a})`;
    CT.fillRect(0, 0, W, H);
  }

  /* ── Canvas Experiments ─────────────────────────── */
  const EXPS = [

    /* 02 · Neural — moving nodes + synapses */
    function Neural() {
      const N = 55;
      const nodes = Array.from({length:N}, () => ({
        x:rnd()*W, y:rnd()*H, vx:rf(-.4,.4), vy:rf(-.4,.4), c:pc()
      }));
      const D = 150;
      return () => {
        fade(.12);
        nodes.forEach(n => {
          n.x += n.vx; n.y += n.vy;
          if(n.x<0||n.x>W) n.vx*=-1;
          if(n.y<0||n.y>H) n.vy*=-1;
        });
        for(let i=0;i<N;i++) for(let j=i+1;j<N;j++) {
          const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y;
          const d=Math.sqrt(dx*dx+dy*dy);
          if(d<D) {
            CT.strokeStyle = rgba(nodes[i].c, (1-d/D)*.35);
            CT.lineWidth = .5;
            CT.beginPath(); CT.moveTo(nodes[i].x,nodes[i].y); CT.lineTo(nodes[j].x,nodes[j].y); CT.stroke();
          }
        }
        nodes.forEach(n => { CT.fillStyle=rgba(n.c,.8); CT.beginPath(); CT.arc(n.x,n.y,2,0,TAU); CT.fill(); });
      };
    },

    /* 03 · Flow Field — perlin-like particle streams */
    function FlowField() {
      const ps = Array.from({length:600}, () => ({
        x:rnd()*W, y:rnd()*H, c:pc(), life:rf(50,200)
      }));
      let t = 0;
      return () => {
        fade(.02);
        ps.forEach(p => {
          const angle = (Math.sin(p.x*.005+t*.25) + Math.cos(p.y*.005+t*.18)) * TAU;
          p.x += Math.cos(angle)*1.8; p.y += Math.sin(angle)*1.8; p.life--;
          if(p.x<0||p.x>W||p.y<0||p.y>H||p.life<=0) {
            p.x=rnd()*W; p.y=rnd()*H; p.life=rf(50,200);
          }
          CT.fillStyle = rgba(p.c, .22);
          CT.fillRect(p.x, p.y, 1.5, 1.5);
        });
        t += .007;
      };
    },

    /* 04 · Matrix — falling katakana + binary */
    function Matrix() {
      const cols = Math.floor(W/16);
      const drops = Array.from({length:cols}, () => ri(H/16));
      const chars = '01アイウエオカキクケコサシスセソタチツ01テトナニヌネノ';
      return () => {
        fade(.055);
        CT.font = '13px monospace';
        drops.forEach((y, i) => {
          CT.fillStyle = rnd()>.3 ? 'rgba(0,212,255,.85)' : 'rgba(0,212,255,.18)';
          CT.fillText(chars[ri(chars.length)], i*16, y*16);
          if(y*16>H && rnd()>.975) drops[i]=0; else drops[i]++;
        });
      };
    },

    /* 09 · Vortex — spiral particle drain */
    function Vortex() {
      const R0 = Math.min(W,H)*.46;
      const ps = Array.from({length:500}, () => ({
        angle:rnd()*TAU, r:rnd()*R0, speed:rf(.008,.026), c:pc(), size:rf(1,2.5)
      }));
      return () => {
        fade(.06);
        ps.forEach(p => {
          p.angle += p.speed * (1.2 - p.r/R0);
          p.r -= .08;
          if(p.r<3) { p.r=rnd()*R0; p.angle=rnd()*TAU; }
          CT.fillStyle = rgba(p.c, p.r/R0*.5);
          CT.fillRect(W/2+Math.cos(p.angle)*p.r, H/2+Math.sin(p.angle)*p.r, p.size, p.size);
        });
      };
    },

    /* 13 · Lissajous — parametric drawing machine */
    function Lissajous() {
      const trails = [];
      let t = 0;
      const A=W*.36, B=H*.36, a=3, b=2, delta=Math.PI/4;
      return () => {
        fade(.035);
        trails.push([W/2+A*Math.sin(a*t+delta), H/2+B*Math.sin(b*t)]);
        if(trails.length>900) trails.shift();
        trails.forEach(([px,py], i) => {
          const prog = i/trails.length;
          CT.fillStyle = rgba(PAL[Math.floor(prog*PAL.length)], prog*.7);
          CT.beginPath(); CT.arc(px, py, prog*2.5, 0, TAU); CT.fill();
        });
        t += .012;
      };
    },

    /* 14 · Lightning — electric branching bolts */
    function Lightning() {
      let bolts = [], t = 0;
      function seg(x1,y1,x2,y2,d) {
        if(d<4) { bolts.push([x1,y1,x2,y2]); return; }
        const mx=(x1+x2)/2+rf(-d*5,d*5), my=(y1+y2)/2+rf(-d*5,d*5);
        seg(x1,y1,mx,my,d/2); seg(mx,my,x2,y2,d/2);
        if(rnd()>.7) seg(mx,my,mx+rf(-d*8,d*8),my+rf(30,90),d/2);
      }
      function strike() { bolts=[]; seg(rnd()*W,0,rf(W*.2,W*.8),rf(H*.3,H*.9),20); }
      strike();
      return () => {
        fade(.18);
        CT.shadowColor='rgba(167,139,250,.8)'; CT.shadowBlur=6;
        CT.strokeStyle='rgba(255,255,255,.5)'; CT.lineWidth=.8;
        bolts.forEach(([x1,y1,x2,y2])=>{ CT.beginPath(); CT.moveTo(x1,y1); CT.lineTo(x2,y2); CT.stroke(); });
        CT.strokeStyle='rgba(167,139,250,.4)'; CT.lineWidth=2;
        bolts.forEach(([x1,y1,x2,y2])=>{ CT.beginPath(); CT.moveTo(x1,y1); CT.lineTo(x2,y2); CT.stroke(); });
        CT.shadowBlur=0;
        if(t%100===0||t%100===2) strike();
        t++;
      };
    },

    /* 16 · Rain — colored vertical drops */
    function Rain() {
      const drops = Array.from({length:120}, () => ({
        x:rnd()*W, y:rnd()*H, l:rf(15,55), v:rf(4,12), c:pc(), a:rf(.15,.45)
      }));
      return () => {
        fade(.12);
        drops.forEach(d => {
          d.y += d.v; if(d.y>H+d.l) { d.y=-d.l; d.x=rnd()*W; }
          const [r,g,b]=h2r(d.c);
          const gr=CT.createLinearGradient(d.x,d.y-d.l,d.x,d.y);
          gr.addColorStop(0,`rgba(${r},${g},${b},0)`);
          gr.addColorStop(1,`rgba(${r},${g},${b},${d.a})`);
          CT.strokeStyle=gr; CT.lineWidth=1;
          CT.beginPath(); CT.moveTo(d.x,d.y-d.l); CT.lineTo(d.x,d.y); CT.stroke();
        });
      };
    },

    /* 18 · Organic Blob — morphing aurora shape */
    function Blob() {
      let t = 0;
      return () => {
        CT.clearRect(0,0,W,H);
        const cx=W/2, cy=H/2, R=Math.min(W,H)*.28, pts=22;
        [[0,'#00D4FF'],[TAU/3,'#A78BFA'],[TAU*2/3,'#F472B6']].forEach(([phase,col])=>{
          const [r,g,b]=h2r(col);
          const gr=CT.createRadialGradient(cx,cy,0,cx,cy,R*1.7);
          gr.addColorStop(0,`rgba(${r},${g},${b},.13)`);
          gr.addColorStop(.5,`rgba(${r},${g},${b},.05)`);
          gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
          CT.fillStyle=gr;
          CT.beginPath();
          const ox=cx+Math.cos(t*.18)*55, oy=cy+Math.sin(t*.24)*38;
          for(let i=0;i<=pts;i++) {
            const a=i/pts*TAU;
            const n=Math.sin(a*3+t+phase)*.18+Math.sin(a*5+t*1.2+phase)*.1;
            const r2=R*(1+n);
            i===0?CT.moveTo(ox+Math.cos(a)*r2,oy+Math.sin(a)*r2):CT.lineTo(ox+Math.cos(a)*r2,oy+Math.sin(a)*r2);
          }
          CT.closePath(); CT.fill();
        });
        t += .018;
      };
    },

    /* 19 · Orbits — planetary trail systems */
    function Orbits() {
      const systems = Array.from({length:3}, () => ({
        cx:rf(W*.15,W*.85), cy:rf(H*.15,H*.85),
        planets:Array.from({length:ri(3)+2},(_,i)=>({
          r:(i+1)*rf(35,55), angle:rnd()*TAU, speed:rf(.006,.022),
          size:rf(2,5), c:pc(), trail:[]
        }))
      }));
      return () => {
        fade(.08);
        systems.forEach(sys=>{
          sys.planets.forEach(p=>{
            p.angle+=p.speed;
            const x=sys.cx+Math.cos(p.angle)*p.r, y=sys.cy+Math.sin(p.angle)*p.r;
            p.trail.push([x,y]); if(p.trail.length>55) p.trail.shift();
            CT.strokeStyle='rgba(255,255,255,.04)'; CT.lineWidth=1;
            CT.beginPath(); CT.arc(sys.cx,sys.cy,p.r,0,TAU); CT.stroke();
            const [r,g,b]=h2r(p.c);
            p.trail.forEach(([tx,ty],ti)=>{
              const prog=ti/p.trail.length;
              CT.fillStyle=`rgba(${r},${g},${b},${prog*.4})`;
              CT.beginPath(); CT.arc(tx,ty,p.size*prog,0,TAU); CT.fill();
            });
            CT.fillStyle=p.c; CT.beginPath(); CT.arc(x,y,p.size,0,TAU); CT.fill();
          });
        });
      };
    },

    /* 20 · Explosion — burst particles looping */
    function Explosion() {
      let ps=[], t=0;
      function burst() {
        const cx=rf(W*.2,W*.8), cy=rf(H*.2,H*.8);
        for(let i=0;i<80;i++) {
          const a=rnd()*TAU, s=rf(1,6);
          ps.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,c:pc()});
        }
      }
      burst();
      return () => {
        fade(.1);
        ps=ps.filter(p=>{
          p.x+=p.vx; p.y+=p.vy; p.vx*=.98; p.vy*=.98; p.vy+=.04; p.life-=.01;
          if(p.life<=0) return false;
          CT.fillStyle=rgba(p.c,p.life*.7);
          CT.beginPath(); CT.arc(p.x,p.y,p.life*3,0,TAU); CT.fill();
          return true;
        });
        if(ps.length<50||t%160===0) burst();
        t++;
      };
    },

    /* 21 · Binary Rain — falling 0/1 columns */
    function BinaryRain() {
      const cols=Math.floor(W/22);
      const drops=Array.from({length:cols},()=>({y:rnd()*H/22, speed:rf(.4,1.8)}));
      return () => {
        fade(.06);
        CT.font='bold 15px monospace';
        drops.forEach((d,i)=>{
          CT.fillStyle=`rgba(52,211,153,${rf(.3,.9)})`;
          CT.fillText(ri(2),i*22,d.y*22);
          d.y+=d.speed;
          if(d.y*22>H&&rnd()>.98) d.y=0;
        });
      };
    },

    /* 22 · Magnetic Field — animated field lines */
    function MagneticField() {
      let t=0, lines=[], recompute=0;
      function compute(p1,p2) {
        const out=[];
        for(let i=0;i<28;i++) {
          const a=i/28*TAU, pts=[];
          let x=p1.x+Math.cos(a)*18, y=p1.y+Math.sin(a)*18;
          for(let s=0;s<180;s++) {
            pts.push([x,y]);
            let fx=0,fy=0;
            [[p1,1],[p2,-1]].forEach(([p,sign])=>{
              const dx=x-p.x,dy=y-p.y,d=Math.sqrt(dx*dx+dy*dy)||1;
              fx+=sign*dx/(d*d*d)*800; fy+=sign*dy/(d*d*d)*800;
            });
            const mag=Math.sqrt(fx*fx+fy*fy)||1;
            x+=fx/mag*3; y+=fy/mag*3;
            if(x<0||x>W||y<0||y>H) break;
          }
          out.push(pts);
        }
        return out;
      }
      const p1=()=>({x:W*.3+Math.sin(t)*42,y:H*.5+Math.cos(t*.7)*22});
      const p2=()=>({x:W*.7+Math.cos(t)*42,y:H*.5+Math.sin(t*.7)*22});
      lines=compute(p1(),p2());
      return () => {
        fade(.08);
        if(recompute++%88===0) lines=compute(p1(),p2());
        CT.strokeStyle='rgba(0,212,255,.18)'; CT.lineWidth=.8;
        lines.forEach(pts=>{ if(pts.length<2)return; CT.beginPath(); pts.forEach(([px,py],i)=>i===0?CT.moveTo(px,py):CT.lineTo(px,py)); CT.stroke(); });
        const [a,b]=[p1(),p2()];
        CT.fillStyle='rgba(0,212,255,.8)';
        [a,b].forEach(p=>{ CT.beginPath();CT.arc(p.x,p.y,5,0,TAU);CT.fill(); });
        t+=.01;
      };
    },

    /* 24 · Noise Landscape — layered terrain waves */
    function NoiseLandscape() {
      let t=0;
      const layers=[
        {a:.09,c:'#00D4FF',ys:.58},
        {a:.07,c:'#A78BFA',ys:.68},
        {a:.05,c:'#34D399',ys:.78},
      ];
      return () => {
        CT.clearRect(0,0,W,H);
        layers.forEach(({a,c,ys})=>{
          const [r,g,b]=h2r(c);
          CT.fillStyle=`rgba(${r},${g},${b},${a})`;
          CT.beginPath(); CT.moveTo(-10,H);
          for(let x=-10;x<=W+10;x+=6) {
            CT.lineTo(x, H*ys+Math.sin(x*.006+t)*85+Math.sin(x*.013+t*.6)*42+Math.sin(x*.003+t*.3)*105);
          }
          CT.lineTo(W+10,H); CT.closePath(); CT.fill();
        });
        t+=.008;
      };
    },

  ]; /* end EXPS */

  /* ── Bold / Indie Color Experiments (+8) ───────────── */
  const BOLD = [

    /* B4 · Chromatic — RGB prism split trails */
    function Chromatic() {
      const ps=Array.from({length:180},(_,i)=>({
        x:rnd()*W, y:rnd()*H,
        vx:rf(-1,1), vy:rf(-1,1),
        trail:[], hue: i*(360/180)
      }));
      let t=0;
      return () => {
        CT.fillStyle='rgba(5,0,10,.08)'; CT.fillRect(0,0,W,H);
        ps.forEach(p=>{
          p.x+=p.vx+Math.sin(t*0.5+p.hue*.01)*.4;
          p.y+=p.vy+Math.cos(t*0.4+p.hue*.01)*.4;
          if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1;
          p.hue=(p.hue+.3)%360;
          p.trail.push([p.x,p.y]); if(p.trail.length>18)p.trail.shift();
          p.trail.forEach(([tx,ty],ti)=>{
            const a=ti/p.trail.length;
            CT.fillStyle=`hsla(${p.hue},100%,65%,${a*.5})`;
            CT.beginPath(); CT.arc(tx,ty,a*3,0,TAU); CT.fill();
          });
        });
        t+=.012;
      };
    },

    /* B7 · Y2K — hot pink + electric blue + stars */
    function Y2K() {
      let t=0;
      const stars=Array.from({length:60},()=>({x:rnd()*W,y:rnd()*H,r:rf(2,8),vr:rf(-.05,.05),a:rnd()*TAU,va:rf(-.03,.03),c:['#ff00ff','#00ffff','#ff69b4','#fff'][ri(4)]}));
      return () => {
        CT.clearRect(0,0,W,H);
        // Gradient bg
        const bg=CT.createLinearGradient(0,0,W,H);
        bg.addColorStop(0,'#1a0030'); bg.addColorStop(.5,'#000d30'); bg.addColorStop(1,'#1a0030');
        CT.fillStyle=bg; CT.fillRect(0,0,W,H);
        // Grid
        CT.strokeStyle='rgba(0,255,255,.08)'; CT.lineWidth=1;
        for(let x=0;x<W;x+=40){CT.beginPath();CT.moveTo(x,0);CT.lineTo(x,H);CT.stroke();}
        for(let y=0;y<H;y+=40){CT.beginPath();CT.moveTo(0,y);CT.lineTo(W,y);CT.stroke();}
        // Stars/asterisks
        stars.forEach(s=>{
          s.r+=s.vr; if(s.r<2||s.r>9)s.vr*=-1;
          s.a+=s.va;
          CT.save(); CT.translate(s.x,s.y); CT.rotate(s.a);
          CT.strokeStyle=s.c+'cc'; CT.lineWidth=1.5;
          CT.shadowColor=s.c; CT.shadowBlur=6;
          for(let i=0;i<4;i++){
            CT.beginPath(); CT.moveTo(0,-s.r); CT.lineTo(0,s.r); CT.stroke(); CT.rotate(Math.PI/4);
          }
          CT.shadowBlur=0; CT.restore();
        });
        // Center glow
        const cg=CT.createRadialGradient(W/2,H/2,0,W/2,H/2,W*.4);
        cg.addColorStop(0,'rgba(255,0,255,.12)'); cg.addColorStop(.5,'rgba(0,255,255,.06)'); cg.addColorStop(1,'rgba(0,0,0,0)');
        CT.fillStyle=cg; CT.fillRect(0,0,W,H);
        t+=.012;
      };
    },

  ]; /* end BOLD */

  /* ── Video experiments ──────────────────────────── */
  const VIDEOS = [
    'hero-bg.mp4','hero-bg2.mp4','hero-bg3.mp4',
    'hero-bg4.mp4','hero-bg5.mp4','hero-bg6.mp4'
  ];

  /* ── Pick & Run ─────────────────────────────────── */
  const ALL_CANVAS = [...EXPS, ...BOLD]; // 13 dark + 2 bold = 15 canvas
  const total = VIDEOS.length + ALL_CANVAS.length; // 6 + 15 = 21
  const pick  = ri(total);

  if (pick < VIDEOS.length) {
    /* Video mode — show video, canvas shows reactive dot grid */
    VD.src = VIDEOS[pick];
    VD.style.display = 'block';

    /* Reactive dot grid on top (desktop only) */
    if (window.innerWidth > 768) {
      const COLS = ['#00D4FF','#A78BFA','#F472B6','#34D399'];
      let mx=-9999, my=-9999, dots=[];
      const GAP=32, DR=1.8, RAD=120, FORCE=18;
      function initDots() {
        resize();
        dots=[];
        for(let x=GAP;x<W;x+=GAP) for(let y=GAP;y<H;y+=GAP)
          dots.push({ox:x,oy:y,x,y,color:COLS[ri(COLS.length)]});
      }
      window.addEventListener('mousemove',e=>{const r=CV.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;});
      window.addEventListener('resize',initDots);
      function drawDots() {
        CT.clearRect(0,0,W,H);
        dots.forEach(d=>{
          const dx=d.ox-mx, dy=d.oy-my, dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<RAD){const f=(1-dist/RAD)*FORCE;d.x+=(d.ox+(dx/dist)*f-d.x)*.18;d.y+=(d.oy+(dy/dist)*f-d.y)*.18;}
          else{d.x+=(d.ox-d.x)*.08;d.y+=(d.oy-d.y)*.08;}
          const prox=Math.max(0,1-dist/RAD);
          CT.beginPath(); CT.arc(d.x,d.y,DR+prox*2.5,0,TAU);
          CT.fillStyle = prox>.1 ? d.color+Math.round((.15+prox*.7)*255).toString(16).padStart(2,'0') : 'rgba(255,255,255,.1)';
          CT.fill();
        });
        requestAnimationFrame(drawDots);
      }
      initDots(); drawDots();
    }

  } else {
    /* Canvas experiment mode — hide video */
    VD.style.display = 'none';
    CV.style.opacity = '1';
    const drawFn = ALL_CANVAS[pick - VIDEOS.length]();
    if (drawFn) {
      (function loop() { drawFn(); requestAnimationFrame(loop); })();
    }
  }

})();
