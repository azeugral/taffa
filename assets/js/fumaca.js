/* Fundo do hero: fumaça de nanquim sobre o papel, sutil.
   Véus de fumaça de um fbm de simplex torcido duas vezes sobre si mesmo (domain warp), iluminados por uma
   luz baixa atrás da foto, e alguns fios claros finos, raros. Contraste baixo de propósito: a fumaça fica
   atrás do conteúdo. O dither por pixel evita degraus nos gradientes escuros.
   fumacaGL(canvas) -> {tamanho(w,h), desenhar(fase, eixo)}; fase em [0, 2π) fecha o loop sem emenda e eixo
   é a posição horizontal da luz (centro da foto). O mesmo shader gera os MP4 (tools/gerar_video.py). */
(function (g) {
  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `
precision highp float;
uniform vec2 uRes; uniform float uFase; uniform float uEixo;

/* simplex 2D (Ashima / Stefan Gustavson) */
vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 m289(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 perm(vec3 x){return m289(((x*34.)+1.)*x);}
float sn(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=m289(i);
  vec3 p=perm(perm(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 gg; gg.x=a0.x*x0.x+h.x*x0.y; gg.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,gg);
}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
/* fbm de simplex, 0..1 */
float fbm(vec2 p){
  float s=0.,a=.5;
  for(int i=0;i<5;i++){ s+=a*sn(p); p=rot(.57)*p*1.93+vec2(3.1,1.7); a*=.48; }
  return .5+.5*s;
}

void main(){
  vec2 fc=gl_FragCoord.xy;
  float esc=min(uRes.x,uRes.y);
  vec2 p=(fc-.5*uRes)/esc;
  vec2 c=vec2(cos(uFase),sin(uFase));

  /* a fumaça sobe devagar e se dobra: dois níveis de torção, cada um girando num círculo da fase */
  /* esticada na vertical: a fumaça forma véus longos subindo, não manchas */
  vec2 w=p*vec2(1.25,.5);
  vec2 q=vec2(fbm(w*.7+c*.3),fbm(w*.7+vec2(5.2,1.3)-c.yx*.3));
  vec2 r=vec2(fbm(w*.8+1.6*q+vec2(1.7,9.2)+c.yx*.18),fbm(w*.8+1.6*q+vec2(8.3,2.8)-c*.18));
  float d=fbm(w*.9+1.9*r);

  /* véu: densidade suave; fio: as cristas finas da mesma fumaça */
  float veu=smoothstep(.38,.92,d); veu*=veu;
  float cr=1.-abs(fbm(w*1.1+r*1.2+q*.6)*2.-1.);
  float fio=pow(cr,22.)*smoothstep(.4,.85,d);

  /* luz baixa atrás da foto, mais forte embaixo, e sombra nas bordas */
  vec2 lc=vec2((uEixo-.5)*uRes.x/esc,-.08);
  float luz=exp(-dot((p-lc)*vec2(.9,1.15),(p-lc)*vec2(.9,1.15))*1.6);
  float base=smoothstep(.7,-.55,p.y);
  float m=.18+.82*clamp(luz*.85+base*.35,0.,1.);

  /* no papel a fumaça é de nanquim: escurece em véus cinza e os fios são um traço mais fechado */
  vec3 papel=vec3(.949,.937,.910);
  vec3 cinza=vec3(.5,.5,.52);
  vec3 col=papel-cinza*veu*m*.2-vec3(.62,.62,.64)*fio*m*.26;
  /* uma sombra quase imperceptível atrás da foto */
  col-=vec3(.03)*luz*.5;
  vec2 v=fc/uRes-.5; col*=1.-.08*dot(v,v);
  /* dither: ruído de gradiente intercalado, troca a cada quadro, some no vídeo comprimido e na tela */
  vec2 gq=fc+vec2(5.588,2.37)*floor(fract(uFase*9.)*64.);
  col+=(fract(52.9829189*fract(dot(gq,vec2(.06711056,.00583715))))-.5)/255.;
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;

  g.fumacaGL = function (cv, op = {}) {
    const gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: !!op.preserveDrawingBuffer, powerPreference: 'high-performance' });
    if (!gl) return null;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const u = n => gl.getUniformLocation(pr, n);
    const uR = u('uRes'), uF = u('uFase'), uE = u('uEixo');
    return {
      tamanho(w, h) { cv.width = w; cv.height = h; },
      desenhar(fase, eixo) {
        gl.viewport(0, 0, cv.width, cv.height);
        gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uF, fase); gl.uniform1f(uE, eixo ?? .5);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  };
})(window);
