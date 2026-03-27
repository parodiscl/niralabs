/* ═══════════════════════════════════════════════════════
   NIRA LABS — Hero Experiment Engine
   40 backgrounds random: 6 videos + 34 canvas experiments
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

    /* 01 · Stars — flying through space */
    function Stars() {
      const pts = Array.from({length:220}, () => ({
        x: rnd()*W, y: rnd()*H, z: rnd(), vz: rf(.003,.009)
      }));
      return () => {
        fade(.15);
        pts.forEach(p => {
          p.z += p.vz;
          if (p.z > 1) { p.z = .01; p.x = rnd()*W; p.y = rnd()*H; }
          CT.fillStyle = `rgba(255,255,255,${Math.min(p.z*2,1)})`;
          CT.beginPath(); CT.arc(p.x, p.y, p.z*2.5, 0, TAU); CT.fill();
        });
      };
    },

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

    /* 05 · Pulse Rings — expanding from center */
    function PulseRings() {
      const rings = [];
      let t = 0;
      return () => {
        fade(.08);
        if(t%85===0) rings.push({r:0, a:.7, c:pc()});
        for(let i=rings.length-1; i>=0; i--) {
          const r=rings[i]; r.r+=1.8; r.a-=.007;
          if(r.a<=0) { rings.splice(i,1); continue; }
          CT.strokeStyle = rgba(r.c, r.a);
          CT.lineWidth = 1.5;
          CT.beginPath(); CT.arc(W/2, H/2, r.r, 0, TAU); CT.stroke();
        }
        t++;
      };
    },

    /* 06 · Waving Mesh — distorted grid */
    function WaveMesh() {
      let t = 0; const S = 55;
      return () => {
        CT.clearRect(0, 0, W, H);
        CT.strokeStyle = 'rgba(0,212,255,.1)'; CT.lineWidth = .8;
        for(let x=0; x<=W+S; x+=S) {
          CT.beginPath();
          for(let y=0; y<=H; y+=5) {
            const wx = x + Math.sin(y*.018+t)*36 + Math.sin(y*.031+t*.7)*14;
            y===0 ? CT.moveTo(wx,y) : CT.lineTo(wx,y);
          }
          CT.stroke();
        }
        for(let y=0; y<=H+S; y+=S) {
          CT.beginPath();
          for(let x=0; x<=W; x+=5) {
            const wy = y + Math.sin(x*.018+t)*36 + Math.sin(x*.031+t*.7)*14;
            x===0 ? CT.moveTo(x,wy) : CT.lineTo(x,wy);
          }
          CT.stroke();
        }
        t += .012;
      };
    },

    /* 07 · Constellation — stars connecting when close */
    function Constellation() {
      const N = 80;
      const pts = Array.from({length:N}, () => ({
        x:rnd()*W, y:rnd()*H, vx:rf(-.18,.18), vy:rf(-.18,.18), r:rf(1,2.5)
      }));
      const D = 130;
      return () => {
        fade(.1);
        pts.forEach(p => {
          p.x+=p.vx; p.y+=p.vy;
          if(p.x<0)p.x=W; if(p.x>W)p.x=0;
          if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        });
        for(let i=0;i<N;i++) for(let j=i+1;j<N;j++) {
          const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
          const d=Math.sqrt(dx*dx+dy*dy);
          if(d<D) {
            CT.strokeStyle = `rgba(255,255,255,${(1-d/D)*.12})`;
            CT.lineWidth = .5;
            CT.beginPath(); CT.moveTo(pts[i].x,pts[i].y); CT.lineTo(pts[j].x,pts[j].y); CT.stroke();
          }
        }
        pts.forEach(p => { CT.fillStyle='rgba(255,255,255,.65)'; CT.beginPath(); CT.arc(p.x,p.y,p.r,0,TAU); CT.fill(); });
      };
    },

    /* 08 · Neon Grid — retro perspective floor */
    function NeonGrid() {
      let t = 0;
      return () => {
        CT.clearRect(0, 0, W, H);
        const hor = H*.57;
        const gr = CT.createLinearGradient(0, hor, 0, H);
        gr.addColorStop(0, 'rgba(0,212,255,.12)');
        gr.addColorStop(1, 'rgba(167,139,250,.04)');
        CT.fillStyle = gr; CT.fillRect(0, hor, W, H-hor);
        CT.strokeStyle = 'rgba(0,212,255,.22)'; CT.lineWidth = 1;
        for(let i=-22; i<=22; i++) {
          CT.beginPath(); CT.moveTo(W/2+i*(W/14), hor); CT.lineTo(W/2+i*W*5, H+300); CT.stroke();
        }
        for(let i=1; i<=22; i++) {
          const y = hor + (H-hor)*Math.pow(((i-1+(t%1))/22), 1.7);
          if(y>H) continue;
          CT.strokeStyle = `rgba(0,212,255,${.18*(1-(y-hor)/(H-hor))+.04})`;
          CT.beginPath(); CT.moveTo(0,y); CT.lineTo(W,y); CT.stroke();
        }
        t += .018;
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

    /* 10 · Aurora — soft color wave bands */
    function Aurora() {
      let t = 0;
      const waves = [
        {c:[0,212,255],  off:0  },
        {c:[167,139,250],off:1.5},
        {c:[52,211,153], off:3  },
        {c:[244,114,182],off:4.5}
      ];
      return () => {
        CT.clearRect(0, 0, W, H);
        waves.forEach(w => {
          for(let layer=0; layer<2; layer++) {
            const yBase = H*.28 + layer*90 + Math.sin(t*.35+w.off)*75;
            const gr = CT.createLinearGradient(0, yBase-110, 0, yBase+110);
            gr.addColorStop(0, `rgba(${w.c},0)`);
            gr.addColorStop(.5, `rgba(${w.c[0]},${w.c[1]},${w.c[2]},.07)`);
            gr.addColorStop(1, `rgba(${w.c},0)`);
            CT.fillStyle = gr;
            CT.beginPath(); CT.moveTo(-10, yBase);
            for(let x=0; x<=W+10; x+=14) {
              CT.lineTo(x, yBase + Math.sin(x*.004+t*.5+w.off)*65 + Math.sin(x*.009+t*.3)*28);
            }
            CT.lineTo(W+10,H); CT.lineTo(-10,H); CT.closePath(); CT.fill();
          }
        });
        t += .012;
      };
    },

    /* 11 · Smoke — rising particle plumes */
    function Smoke() {
      const ps = Array.from({length:65}, () => ({
        x:W/2+rf(-W*.2,W*.2), y:H+rf(0,60),
        vx:rf(-.4,.4), vy:rf(-.8,-.2),
        r:rf(30,80), a:rf(.025,.06), c:pc()
      }));
      return () => {
        fade(.04);
        ps.forEach(p => {
          p.x += p.vx + Math.sin(p.y*.01)*.3;
          p.y += p.vy; p.r += .4; p.a -= .0003;
          if(p.y+p.r<0||p.a<=0) {
            p.x=W/2+rf(-W*.2,W*.2); p.y=H+60; p.r=rf(30,80); p.a=rf(.025,.06); p.vy=rf(-.8,-.2);
          }
          const [r,g,b]=h2r(p.c);
          const gr=CT.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
          gr.addColorStop(0,`rgba(${r},${g},${b},${p.a})`);
          gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
          CT.fillStyle=gr; CT.beginPath(); CT.arc(p.x,p.y,p.r,0,TAU); CT.fill();
        });
      };
    },

    /* 12 · Bokeh — defocused light orbs */
    function Bokeh() {
      const cs = Array.from({length:28}, () => ({
        x:rnd()*W, y:rnd()*H, r:rf(40,130), a:rf(.015,.04),
        vx:rf(-.15,.15), vy:rf(-.15,.15), dr:rf(-.05,.05), c:pc()
      }));
      return () => {
        fade(.04);
        cs.forEach(c => {
          c.x+=c.vx; c.y+=c.vy; c.r+=c.dr;
          if(c.r<30||c.r>140) c.dr*=-1;
          if(c.x<-c.r)c.x=W+c.r; if(c.x>W+c.r)c.x=-c.r;
          if(c.y<-c.r)c.y=H+c.r; if(c.y>H+c.r)c.y=-c.r;
          const [r,g,b]=h2r(c.c);
          const gr=CT.createRadialGradient(c.x,c.y,0,c.x,c.y,c.r);
          gr.addColorStop(0,`rgba(${r},${g},${b},${c.a})`);
          gr.addColorStop(.5,`rgba(${r},${g},${b},${c.a*.4})`);
          gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
          CT.fillStyle=gr; CT.beginPath(); CT.arc(c.x,c.y,c.r,0,TAU); CT.fill();
          CT.strokeStyle=`rgba(${r},${g},${b},${c.a*2.5})`; CT.lineWidth=1; CT.stroke();
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

    /* 15 · Signal — EKG heartbeat line */
    function Signal() {
      const pts = new Array(W).fill(H/2);
      let t = 0;
      return () => {
        CT.clearRect(0,0,W,H);
        CT.strokeStyle='rgba(0,212,255,.04)'; CT.lineWidth=1;
        for(let y=0;y<H;y+=40){ CT.beginPath();CT.moveTo(0,y);CT.lineTo(W,y);CT.stroke(); }
        for(let x=0;x<W;x+=40){ CT.beginPath();CT.moveTo(x,0);CT.lineTo(x,H);CT.stroke(); }
        const spike = Math.sin(t*10)>.97;
        const ny = H/2 + Math.sin(t)*52 + Math.sin(t*3)*16 + (spike?-130:0);
        pts.shift(); pts.push(ny);
        CT.strokeStyle='rgba(52,211,153,.9)'; CT.lineWidth=2;
        CT.shadowColor='rgba(52,211,153,.6)'; CT.shadowBlur=10;
        CT.beginPath(); pts.forEach((y,x)=>x===0?CT.moveTo(x,y):CT.lineTo(x,y)); CT.stroke();
        CT.shadowBlur=0;
        t += .04;
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

    /* 17 · Scan Glitch — corrupted screen art */
    function ScanGlitch() {
      let t = 0;
      return () => {
        fade(.22);
        for(let y=0;y<H;y+=2) {
          CT.fillStyle=`rgba(0,212,255,${(Math.sin(y*.1+t)*.5+.5)*.025})`;
          CT.fillRect(0,y,W,1);
        }
        if(rnd()>.88) {
          const gy=rnd()*H, gh=rf(2,25);
          try { CT.drawImage(CV,0,gy,W,gh,rf(-40,40),gy,W,gh); } catch(e){}
          CT.fillStyle='rgba(167,139,250,.04)'; CT.fillRect(0,gy,W,gh);
        }
        if(rnd()>.96) { CT.fillStyle='rgba(244,114,182,.15)'; CT.fillRect(rnd()*W,0,rf(1,4),H); }
        t += .04;
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

    /* 23 · Hex Tunnel — infinite zoom perspective */
    function HexTunnel() {
      let t=0;
      return () => {
        CT.clearRect(0,0,W,H);
        for(let i=13;i>=0;i--) {
          const prog=(i+t%1)/13;
          const r=prog*Math.min(W,H)*.74;
          const [R,G,B]=h2r(PAL[i%PAL.length]);
          CT.strokeStyle=`rgba(${R},${G},${B},${(1-prog)*.18})`; CT.lineWidth=1;
          CT.beginPath();
          for(let j=0;j<=6;j++) {
            const a=j/6*TAU+t*.25;
            j===0?CT.moveTo(W/2+Math.cos(a)*r,H/2+Math.sin(a)*r):CT.lineTo(W/2+Math.cos(a)*r,H/2+Math.sin(a)*r);
          }
          CT.stroke();
          if(i>0) {
            const pr=((i-1+t%1)/13)*Math.min(W,H)*.74;
            for(let j=0;j<6;j++) {
              const a=j/6*TAU+t*.25;
              CT.beginPath();
              CT.moveTo(W/2+Math.cos(a)*r,H/2+Math.sin(a)*r);
              CT.lineTo(W/2+Math.cos(a)*pr,H/2+Math.sin(a)*pr);
              CT.stroke();
            }
          }
        }
        t+=.018;
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

    /* B1 · Vaporwave — pink/teal sunset + retro grid */
    function Vaporwave() {
      let t = 0;
      return () => {
        CT.clearRect(0,0,W,H);
        // Sky gradient
        const sky = CT.createLinearGradient(0,0,0,H*.6);
        sky.addColorStop(0, '#0D0221');
        sky.addColorStop(.4, '#1a0533');
        sky.addColorStop(.7, '#ff6ec7');
        sky.addColorStop(1, '#ffb347');
        CT.fillStyle=sky; CT.fillRect(0,0,W,H*.6);
        // Sun
        const sunY = H*.42;
        const sunGr = CT.createRadialGradient(W/2,sunY,0,W/2,sunY,H*.22);
        sunGr.addColorStop(0,'#fffb96'); sunGr.addColorStop(.4,'#ff9f43'); sunGr.addColorStop(1,'rgba(255,100,150,0)');
        CT.fillStyle=sunGr; CT.beginPath(); CT.arc(W/2,sunY,H*.22,0,TAU); CT.fill();
        // Scan lines on sun
        for(let i=0;i<8;i++){
          const sy=sunY-H*.14+i*H*.04+Math.sin(t*2)*3;
          CT.fillStyle='rgba(13,2,33,.4)'; CT.fillRect(W/2-H*.22,sy,H*.44,H*.018);
        }
        // Ground gradient
        const gnd = CT.createLinearGradient(0,H*.6,0,H);
        gnd.addColorStop(0,'#120458'); gnd.addColorStop(1,'#0D0221');
        CT.fillStyle=gnd; CT.fillRect(0,H*.6,W,H*.4);
        // Perspective grid
        const hor=H*.6;
        CT.strokeStyle='rgba(255,110,199,.5)'; CT.lineWidth=1;
        for(let i=-20;i<=20;i++){CT.beginPath();CT.moveTo(W/2+i*(W/16),hor);CT.lineTo(W/2+i*W*6,H+500);CT.stroke();}
        for(let i=1;i<=16;i++){
          const y=hor+(H-hor)*Math.pow(((i+(t%1))/16),1.6);
          if(y>H)continue;
          CT.strokeStyle=`rgba(255,110,199,${.4*(1-(y-hor)/(H-hor))})`;
          CT.beginPath();CT.moveTo(0,y);CT.lineTo(W,y);CT.stroke();
        }
        t+=.018;
      };
    },

    /* B2 · Acid — neon green + black psychedelic */
    function Acid() {
      let t=0;
      const ps = Array.from({length:400}, () => ({
        x:rnd()*W, y:rnd()*H,
        vx:rf(-.6,.6), vy:rf(-.6,.6),
        size:rf(2,6), c:['#00ff41','#39ff14','#ccff00','#fff700'][ri(4)]
      }));
      return () => {
        CT.fillStyle='rgba(0,5,0,.15)'; CT.fillRect(0,0,W,H);
        // Noise bg scanlines
        for(let y=0;y<H;y+=4){
          CT.fillStyle=`rgba(0,${ri(30)},0,.04)`; CT.fillRect(0,y,W,2);
        }
        ps.forEach(p=>{
          p.x+=p.vx+Math.sin(p.y*.008+t)*.5;
          p.y+=p.vy+Math.cos(p.x*.008+t)*.5;
          if(p.x<0)p.x=W; if(p.x>W)p.x=0;
          if(p.y<0)p.y=H; if(p.y>H)p.y=0;
          CT.shadowColor=p.c; CT.shadowBlur=8;
          CT.fillStyle=p.c+'cc'; CT.beginPath(); CT.arc(p.x,p.y,p.size,0,TAU); CT.fill();
        });
        CT.shadowBlur=0;
        t+=.01;
      };
    },

    /* B3 · Brutalist — hard color block splits */
    function Brutalist() {
      let t=0;
      const blocks = [
        {x:0,    y:0,    w:.33, h:.5,  c:'#FF3366'},
        {x:.33,  y:0,    w:.34, h:.5,  c:'#FFDD00'},
        {x:.67,  y:0,    w:.33, h:.5,  c:'#0033FF'},
        {x:0,    y:.5,   w:.5,  h:.5,  c:'#00FFCC'},
        {x:.5,   y:.5,   w:.5,  h:.5,  c:'#FF6600'},
      ];
      const lines=Array.from({length:12},()=>({x:rnd(),y:rnd(),vx:rf(-.003,.003),vy:rf(-.003,.003),w:rf(.002,.008),c:['#000','#fff'][ri(2)]}));
      return () => {
        CT.clearRect(0,0,W,H);
        // Animate blocks shifting slowly
        blocks.forEach((b,i)=>{
          const shift=Math.sin(t*0.3+i)*0.02;
          CT.fillStyle=b.c;
          CT.fillRect((b.x+shift)*W,b.y*H,b.w*W+1,b.h*H+1);
        });
        // Hard black lines
        lines.forEach(l=>{
          l.x+=l.vx; l.y+=l.vy;
          if(l.x<0||l.x>1)l.vx*=-1; if(l.y<0||l.y>1)l.vy*=-1;
          CT.fillStyle=l.c; CT.fillRect(l.x*W,0,l.w*W,H);
        });
        // Dark overlay for readability
        CT.fillStyle='rgba(0,0,0,.55)'; CT.fillRect(0,0,W,H);
        // Noise texture
        for(let i=0;i<800;i++){
          const nx=rnd()*W,ny=rnd()*H;
          CT.fillStyle=`rgba(${ri(255)},${ri(255)},${ri(255)},.015)`; CT.fillRect(nx,ny,1,1);
        }
        t+=.008;
      };
    },

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

    /* B5 · Solarpunk — warm amber sunrise + organic */
    function Solarpunk() {
      let t=0;
      const leaves=Array.from({length:40},()=>({
        x:rnd()*W, y:rnd()*H,
        vx:rf(-.2,.2), vy:rf(-.3,-.05),
        size:rf(4,14), rot:rnd()*TAU, vrot:rf(-.02,.02),
        c:['#f9c74f','#f8961e','#43aa8b','#90be6d','#f94144'][ri(5)]
      }));
      return () => {
        CT.clearRect(0,0,W,H);
        // Warm gradient bg
        const bg=CT.createLinearGradient(0,0,W,H);
        bg.addColorStop(0,'#2d1b00'); bg.addColorStop(.4,'#5c2d00');
        bg.addColorStop(.7,'#1a3a2a'); bg.addColorStop(1,'#0d1f17');
        CT.fillStyle=bg; CT.fillRect(0,0,W,H);
        // Sun glow top-right
        const sun=CT.createRadialGradient(W*.8,H*.1,0,W*.8,H*.1,H*.6);
        sun.addColorStop(0,'rgba(255,200,50,.25)'); sun.addColorStop(1,'rgba(255,100,0,0)');
        CT.fillStyle=sun; CT.fillRect(0,0,W,H);
        // Particles/leaves
        leaves.forEach(l=>{
          l.x+=l.vx; l.y+=l.vy; l.rot+=l.vrot;
          if(l.y+l.size<0){l.y=H+l.size; l.x=rnd()*W;}
          CT.save(); CT.translate(l.x,l.y); CT.rotate(l.rot);
          CT.fillStyle=l.c+'bb';
          CT.beginPath(); CT.ellipse(0,0,l.size,l.size/2,0,0,TAU);
          CT.fill(); CT.restore();
        });
        // Ground haze
        const haze=CT.createLinearGradient(0,H*.7,0,H);
        haze.addColorStop(0,'rgba(249,199,79,0)'); haze.addColorStop(1,'rgba(249,199,79,.06)');
        CT.fillStyle=haze; CT.fillRect(0,H*.7,W,H*.3);
        t+=.01;
      };
    },

    /* B6 · Noir — deep red cinematic grain */
    function Noir() {
      let t=0;
      return () => {
        CT.clearRect(0,0,W,H);
        // Deep red vignette bg
        const bg=CT.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.7);
        bg.addColorStop(0,'#1a0000'); bg.addColorStop(.5,'#0d0000'); bg.addColorStop(1,'#000');
        CT.fillStyle=bg; CT.fillRect(0,0,W,H);
        // Red glow left
        const gl=CT.createRadialGradient(W*.15,H*.5,0,W*.15,H*.5,W*.5);
        gl.addColorStop(0,'rgba(180,0,0,.2)'); gl.addColorStop(1,'rgba(180,0,0,0)');
        CT.fillStyle=gl; CT.fillRect(0,0,W,H);
        // Film grain
        const id=CT.createImageData(W,H); const d=id.data;
        for(let i=0;i<d.length;i+=4){
          const g=(rnd()*40)|0;
          d[i]=g+20; d[i+1]=0; d[i+2]=0; d[i+3]=40;
        }
        CT.putImageData(id,0,0);
        // Horizontal scan lines
        for(let y=0;y<H;y+=3){
          CT.fillStyle='rgba(0,0,0,.25)'; CT.fillRect(0,y,W,1);
        }
        // Bright red light sweep
        const sweep=(Math.sin(t*.4)*.5+.5)*W;
        const sw=CT.createLinearGradient(sweep-200,0,sweep+200,0);
        sw.addColorStop(0,'rgba(200,0,0,0)'); sw.addColorStop(.5,'rgba(200,0,0,.08)'); sw.addColorStop(1,'rgba(200,0,0,0)');
        CT.fillStyle=sw; CT.fillRect(0,0,W,H);
        t+=.01;
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

    /* B8 · Synthwave — purple/orange dusk + scan bands */
    function Synthwave() {
      let t=0;
      const ps=Array.from({length:120},()=>({x:rnd()*W,y:rf(H*.3,H),v:rf(1,4),c:['#ff6b35','#f7c59f','#e84393','#7b2d8b'][ri(4)],size:rf(1,3)}));
      return () => {
        CT.clearRect(0,0,W,H);
        // Sky
        const sky=CT.createLinearGradient(0,0,0,H*.65);
        sky.addColorStop(0,'#0a0015'); sky.addColorStop(.4,'#1f0040'); sky.addColorStop(.75,'#8b0050'); sky.addColorStop(1,'#ff4500');
        CT.fillStyle=sky; CT.fillRect(0,0,W,H*.65);
        // Horizon glow
        const hor=CT.createRadialGradient(W/2,H*.65,0,W/2,H*.65,W*.6);
        hor.addColorStop(0,'rgba(255,100,20,.35)'); hor.addColorStop(.4,'rgba(255,50,100,.15)'); hor.addColorStop(1,'rgba(0,0,0,0)');
        CT.fillStyle=hor; CT.fillRect(0,0,W,H);
        // Ground
        const gnd=CT.createLinearGradient(0,H*.65,0,H);
        gnd.addColorStop(0,'#1a0030'); gnd.addColorStop(1,'#050010');
        CT.fillStyle=gnd; CT.fillRect(0,H*.65,W,H*.35);
        // Scan bands
        for(let i=0;i<5;i++){
          const y=((i/5+t*.08)%1)*H*.65;
          CT.fillStyle='rgba(255,100,150,.04)'; CT.fillRect(0,y,W,H*.08);
        }
        // Floating particles
        ps.forEach(p=>{
          p.x+=Math.sin(p.y*.01+t)*.5; p.y-=p.v*.3;
          if(p.y<0)p.y=H;
          CT.fillStyle=p.c+'80'; CT.beginPath(); CT.arc(p.x,p.y,p.size,0,TAU); CT.fill();
        });
        t+=.012;
      };
    },


    /* B9 · ButterMelt — dark organic blobs dripping on warm yellow */
    function ButterMelt() {
      let t = 0;
      const blobs = Array.from({length:7}, () => ({
        x: rnd()*W, y: rnd()*H,
        r: rf(H*.07, H*.2),
        vx: rf(-.22,.22), vy: rf(-.22,.22),
        phase: rnd()*TAU, speed: rf(.005,.015),
        c: ['#1a1400','#2d1b00','#0d0d0d','#120800','#3d2b00'][ri(5)]
      }));
      const drips = Array.from({length:9}, (_, i) => ({
        x: (i/9 + rf(-.04,.04)) * W,
        len: rf(H*.06, H*.32),
        w: rf(3,10),
        bx: rf(-30,30)
      }));
      return () => {
        CT.clearRect(0, 0, W, H);
        // Butter gradient bg
        const bg = CT.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#FFFDE7');
        bg.addColorStop(.45, '#FFF176');
        bg.addColorStop(1, '#FFF44F');
        CT.fillStyle = bg; CT.fillRect(0, 0, W, H);
        // Honey drips from top
        drips.forEach(d => {
          const yOff = Math.sin(t*.55 + d.x*.009) * H*.05;
          CT.strokeStyle = 'rgba(18,8,0,.72)';
          CT.lineWidth = d.w; CT.lineCap = 'round';
          CT.beginPath();
          CT.moveTo(d.x, -4);
          CT.bezierCurveTo(d.x + d.bx*.25, d.len*.3, d.x + d.bx, d.len*.72, d.x + d.bx*.55, d.len + yOff);
          CT.stroke();
          CT.fillStyle = 'rgba(18,8,0,.78)';
          CT.beginPath(); CT.arc(d.x + d.bx*.55, d.len + yOff, d.w*1.45, 0, TAU); CT.fill();
        });
        // Organic dark blobs
        blobs.forEach(b => {
          b.x += b.vx; b.y += b.vy;
          if(b.x < -b.r*2) b.x = W+b.r; if(b.x > W+b.r*2) b.x = -b.r;
          if(b.y < -b.r*2) b.y = H+b.r; if(b.y > H+b.r*2) b.y = -b.r;
          b.phase += b.speed;
          CT.save(); CT.translate(b.x, b.y);
          CT.beginPath();
          for(let i = 0; i <= 12; i++) {
            const ang = (i/12)*TAU;
            const w = b.r * (.6 + .4*Math.sin(ang*3+b.phase)*Math.cos(ang*2.2+b.phase*.65));
            const px = Math.cos(ang)*w, py = Math.sin(ang)*w;
            i === 0 ? CT.moveTo(px, py) : CT.lineTo(px, py);
          }
          CT.closePath();
          CT.fillStyle = b.c + 'e8'; CT.fill();
          CT.strokeStyle = 'rgba(0,0,0,.45)'; CT.lineWidth = 2.5; CT.stroke();
          CT.restore();
        });
        // Lemon accent scatter dots
        for(let i=0; i<18; i++) {
          const dx = (Math.sin(t*1.1+i*2.4)*W*.48+W/2);
          const dy = (Math.cos(t*.9+i*1.7)*H*.42+H/2);
          CT.fillStyle = i%3===0 ? 'rgba(255,100,0,.35)' : 'rgba(0,0,0,.25)';
          CT.beginPath(); CT.arc(dx, dy, rf(2,7), 0, TAU); CT.fill();
        }
        t += .012;
      };
    },

    /* B10 · LemonCrash — kinetic black geometry on electric lemon */
    function LemonCrash() {
      let t = 0;
      const shapes = Array.from({length:28}, () => ({
        x: rnd()*W, y: rnd()*H,
        vx: rf(-1.8,1.8), vy: rf(-1.8,1.8),
        size: rf(W*.018, W*.09),
        rot: rnd()*TAU, vrot: rf(-.05,.05),
        type: ri(4), // 0=tri 1=rect 2=circle 3=diamond
        fill: ['#000000','#111100','#000d00','#1a1a00'][ri(4)],
        outline: ri(2)
      }));
      const streaks = Array.from({length:20}, () => ({
        x: rnd()*W, y: rnd()*H,
        angle: rnd()*TAU, len: rf(W*.04,W*.18),
        v: rf(.8,2.2), w: rf(1,5)
      }));
      return () => {
        CT.clearRect(0, 0, W, H);
        // Electric lemon flat base
        CT.fillStyle = '#FFF44F'; CT.fillRect(0, 0, W, H);
        // Butter patch (off-center glow)
        const patch = CT.createRadialGradient(W*.28, H*.35, 0, W*.28, H*.35, W*.5);
        patch.addColorStop(0,'rgba(255,253,231,.7)'); patch.addColorStop(1,'rgba(255,253,231,0)');
        CT.fillStyle = patch; CT.fillRect(0,0,W,H);
        // Kinetic streaks
        streaks.forEach(s => {
          s.x += Math.cos(s.angle)*s.v; s.y += Math.sin(s.angle)*s.v;
          if(s.x<-s.len||s.x>W+s.len||s.y<-s.len||s.y>H+s.len){s.x=rnd()*W;s.y=rnd()*H;s.angle=rnd()*TAU;}
          CT.strokeStyle = 'rgba(0,0,0,.55)'; CT.lineWidth = s.w; CT.lineCap = 'square';
          CT.beginPath(); CT.moveTo(s.x, s.y);
          CT.lineTo(s.x+Math.cos(s.angle)*s.len, s.y+Math.sin(s.angle)*s.len); CT.stroke();
        });
        // Geometric shapes crashing
        shapes.forEach(s => {
          s.x += s.vx; s.y += s.vy; s.rot += s.vrot;
          if(s.x < -s.size*2||s.x > W+s.size*2) s.vx *= -1;
          if(s.y < -s.size*2||s.y > H+s.size*2) s.vy *= -1;
          CT.save(); CT.translate(s.x, s.y); CT.rotate(s.rot);
          CT.fillStyle = s.fill + 'cc';
          CT.strokeStyle = '#000'; CT.lineWidth = s.outline ? 2.5 : 0;
          CT.beginPath();
          if(s.type===0){CT.moveTo(0,-s.size);CT.lineTo(s.size,s.size);CT.lineTo(-s.size,s.size);CT.closePath();}
          else if(s.type===1){CT.rect(-s.size*.5,-s.size*.5,s.size,s.size);}
          else if(s.type===2){CT.arc(0,0,s.size*.55,0,TAU);}
          else{CT.moveTo(0,-s.size);CT.lineTo(s.size*.7,0);CT.lineTo(0,s.size);CT.lineTo(-s.size*.7,0);CT.closePath();}
          CT.fill(); if(s.outline) CT.stroke();
          CT.restore();
        });
        // Risograph grain
        for(let i=0;i<500;i++){
          CT.fillStyle=`rgba(0,0,0,${rnd()*.04})`;
          CT.fillRect(rnd()*W, rnd()*H, 1, 1);
        }
        // Strobe flicker (subtle)
        if(Math.sin(t*11)>.82){CT.fillStyle='rgba(255,255,255,.07)';CT.fillRect(0,0,W,H);}
        t += .015;
      };
    },

  ]; /* end BOLD */

  /* ── Video experiments ──────────────────────────── */
  const VIDEOS = [
    'hero-bg.mp4','hero-bg2.mp4','hero-bg3.mp4',
    'hero-bg4.mp4','hero-bg5.mp4','hero-bg6.mp4'
  ];

  /* ── Pick & Run ─────────────────────────────────── */
  const ALL_CANVAS = [...EXPS, ...BOLD]; // 24 dark + 10 bold = 34 canvas
  const total = VIDEOS.length + ALL_CANVAS.length; // 6 + 34 = 40
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
