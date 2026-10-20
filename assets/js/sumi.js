/* Fundo do hero: suminagashi, a marmorização de nanquim pingado na água, sobre o papel das folhas de flash.
   Cada gota abre anéis concêntricos (tinta e água alternadas, de área igual) e empurra as gotas mais antigas
   para fora, como na água de verdade: P' = C + (P-C)·sqrt(1 + R²/|P-C|²). O shader faz o caminho inverso,
   da gota mais nova para a mais antiga. Antes disso um fluxo lento torce a superfície, e tudo é espelhado num
   eixo vertical, como os ornamentos simétricos do Taffa. Os anéis saem em preto e, de vez em quando, em
   vermelho ou azul: as três tintas que ele tatua.
   sumiGL(canvas, {eixo}) -> {tamanho(w,h), desenhar(fase, eixo)}; fase em [0, 2π) fecha o loop sem emenda.
   O mesmo shader gera os MP4 do celular (tools/gerar_video.py). */
(function (g) {
  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 uRes; uniform float uFase; uniform float uEixo;

float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float ruido(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*ruido(p);p=rot(.6)*p*2.03+vec2(1.7,9.2);a*=.5;}return s;}

/* gotas, da mais antiga para a mais nova: centro (x a partir do eixo, y), raio, número de anéis */
const int NG=7;
vec4 gota(int i){
  if(i==0) return vec4(0.,.04,.62,17.);
  if(i==1) return vec4(.62,.36,.34,11.);
  if(i==2) return vec4(.40,-.44,.30,9.);
  if(i==3) return vec4(1.05,-.08,.44,13.);
  if(i==4) return vec4(0.,-.62,.24,8.);
  if(i==5) return vec4(1.42,.50,.30,9.);
  return vec4(.16,.66,.17,6.);
}

void main(){
  vec2 fc=gl_FragCoord.xy;
  float esc=min(uRes.x,uRes.y);
  vec2 c=vec2(cos(uFase),sin(uFase));
  /* espelho no eixo, com o vinco suavizado */
  float dx=(fc.x-uEixo*uRes.x)/esc;
  vec2 p=vec2(sqrt(dx*dx+.00006),(fc.y-.5*uRes.y)/esc);

  /* a água se mexe: fluxo lento + um giro suave em volta da gota maior */
  vec2 W=vec2(fbm(p*1.15+c*.32),fbm(p*1.15+vec2(5.2,1.3)-c.yx*.32))-.5;
  p+=W*.2;
  /* franja fina: a borda da tinta nunca é lisa na água */
  p+=(vec2(fbm(p*5.5+c*.5+3.1),fbm(p*5.5-c.yx*.5+7.7))-.5)*.022;
  float r0=length(p-vec2(0.,.04));
  p=vec2(0.,.04)+rot(.22*sin(r0*3.1-uFase)*exp(-r0*.9))*(p-vec2(0.,.04));

  /* do mais novo ao mais antigo: achou a gota, pega o anel; senão desfaz o empurrão e segue */
  float t=-1.; float qual=-1.;
  for(int i=NG-1;i>=0;i--){
    vec4 G=gota(i);
    vec2 v=p-G.xy; float d2=dot(v,v), R2=G.z*G.z;
    if(t<0.){
      if(d2<R2){ t=d2/R2*G.w; qual=float(i); }
      else p=G.xy+v*sqrt(1.-R2/d2);
    }
  }

  vec3 papel=vec3(.949,.937,.910);
  vec3 col=papel;
  if(t>=0.){
    float k=floor(t), f=fract(t);
    float aa=max(fwidth(t),1e-4)*1.6;
    float hk=h21(vec2(qual*7.31+k*1.93,k*.71+qual));
    float hl=h21(vec2(k,qual*3.1));
    float largura=.12+.30*hl*hl;
    float m=smoothstep(0.,aa,f)*(1.-smoothstep(largura-aa,largura,f));
    /* a tinta junta nas bordas do anel e fica mais rala no meio, como nanquim na água */
    float meio=min(f,largura-f)/(largura*.5);
    float densidade=.5+.5*fbm(p*3.4+vec2(qual,k));
    vec3 tinta=vec3(.045,.045,.05); float hf=h21(vec2(k*1.7,qual+2.)); float forca=.22+.72*hf*hf;
    if(hk<.06){ tinta=vec3(.76,.07,.11); forca=.88; }
    else if(hk<.1){ tinta=vec3(.11,.25,.80); forca=.88; }
    float al=m*forca*(.62+.38*densidade)*(.78+.32*(1.-meio)*(1.-meio));
    /* o centro de cada gota fica mais claro, a tinta se espalha para fora */
    al*=smoothstep(0.,1.2,t);
    col=mix(papel,tinta,clamp(al,0.,1.));
    /* entre um anel e outro, a água leva um véu de tinta */
    col=mix(col,tinta,(1.-m)*.025*forca*densidade);
  }
  /* papel: fibra e vinheta leve para o texto do hero respirar */
  float fibra=fbm(gl_FragCoord.xy*vec2(.9,.06))*.022+fbm(gl_FragCoord.xy*.35)*.018;
  col-=fibra;
  vec2 gq=fc+vec2(5.588,2.37)*floor(fract(uFase*7.)*64.);
  col+=(fract(52.9829189*fract(dot(gq,vec2(.06711056,.00583715))))-.5)*.01;
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;

  g.sumiGL = function (cv, op = {}) {
    const gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: !!op.preserveDrawingBuffer, powerPreference: 'low-power' });
    if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;
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
        gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uF, fase); gl.uniform1f(uE, eixo ?? op.eixo ?? .5);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  };
})(window);
