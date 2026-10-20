/* Fundo do hero: ornamento gravado, como os flashs do Taffa e os espelhos que ele grava à mão.
   Corpos de ornamento que nascem de um campo liso (simplex), grossos no meio e afinando em ponta, desenhados
   só com linhas finas: contorno, espinha e um feixe de linhas paralelas que converge na ponta, como buril.
   Cada corpo é a curva de nível f = 0 do campo; a distância até ela é f/|∇f|, então as linhas saem exatas,
   com antialias de um pixel em qualquer resolução. Tudo espelhado num eixo vertical e mudando devagar.
   tintaGL(canvas, {eixo}) -> {tamanho(w,h), desenhar(fase, eixo)}; fase em [0, 2π) fecha o loop sem emenda.
   O mesmo shader gera os MP4 do celular (tools/gerar_video.py). */
(function (g) {
  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `
precision highp float;
uniform vec2 uRes; uniform float uFase; uniform float uEixo;

/* simplex 2D (Ashima / Stefan Gustavson): liso de verdade, sem grade aparente */
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

vec2 C; /* (cos, sin) da fase: o movimento anda num círculo e o loop fecha */
/* campo dos corpos: grande, lento, um pouco torcido */
float campo(vec2 p, float k){
  vec2 w=vec2(sn(p*.55+C*.35+k),sn(p*.55+vec2(4.1,7.3)-C.yx*.35-k));
  p+=w*.42;
  return sn(p*.9+C*.18+vec2(k*3.1,0.))*.78+sn(p*1.7-C.yx*.22+vec2(0.,k*2.3))*.22;
}
/* afinamento: 0 some em ponta, 1 é a largura cheia */
float corpo(vec2 p, float k){ return smoothstep(.05,.75,sn(p*.5+vec2(k*5.7,1.3)-C*.24)); }

/* tela -> campo: espelho no eixo, com o vinco arredondado */
vec2 mapa(vec2 fc){
  float esc=min(uRes.x,uRes.y);
  float dx=(fc.x-uEixo*uRes.x)/esc;
  return vec2(sqrt(dx*dx+.0025),(fc.y-.5*uRes.y)/esc)*1.1;
}
/* um corpo do campo k, na escala s e deslocamento o; w = meia largura em unidades do campo.
   Devolve a distância em pixels até a espinha (x) e a meia largura em pixels (y). O gradiente é medido na
   tela, depois do espelho: assim a distância é exata também no eixo, onde o dobramento achata o campo. */
float F(vec2 fc, float k, float s, vec2 o){ return campo(mapa(fc)*s+o,k); }
vec2 corpoPx(vec2 fc, float k, float s, vec2 o, float w, float px){
  /* gradiente por três amostras a meio pixel, centradas no pixel (dois cálculos a menos que a diferença central) */
  const float h=.5;
  float fa=F(fc+vec2(-h,-h)*.5,k,s,o), fb=F(fc+vec2(h,-h)*.5,k,s,o), fd=F(fc+vec2(-h,h)*.5,k,s,o);
  vec2 g=vec2(fb-fa,fd-fa)/h;
  float f=(fb+fd)*.5;
  /* piso no gradiente: perto de um pico do campo o laço fica vazado em vez de virar mancha */
  float d=abs(f)/max(length(g),.12*px*s);
  float t=corpo(mapa(fc)*s+o,k);
  return vec2(d,w*pow(t,1.35)/(px*s));
}
/* linha fina de meia largura hw (px), com antialias de um pixel */
float fio(float dist, float hw){ return 1.-smoothstep(hw-.55,hw+.55,dist); }

/* gravura: o corpo é desenhado só com linhas finas, como buril em metal ou os espelhos gravados do Taffa.
   Contorno, espinha mais marcada e n linhas de cada lado, sempre as mesmas: elas se juntam sozinhas quando
   o corpo afina, e quando ficam a menos de ~2 px uma da outra viram tinta cheia (a ponta fecha em preto, sem moiré). */
float gravura(vec2 dl, float n, float hw){
  float d=dl.x, lw=dl.y;
  if(lw<.4) return 0.;
  float dentro=1.-smoothstep(lw-.6,lw+.6,d);
  float contorno=fio(abs(d-lw),hw*1.15)*smoothstep(.6,2.5,lw);
  float e=lw/n;
  float hh=abs(fract(d/e+.5)-.5)*e;
  float junto=1.-smoothstep(2.4,4.2,e);
  float feixe=mix(fio(hh,hw*.85)*.9,1.,junto)*dentro;
  float espinha=fio(d,hw*1.35);
  return clamp(max(max(contorno,espinha),feixe),0.,1.)*smoothstep(.4,1.6,lw);
}

void main(){
  vec2 fc=gl_FragCoord.xy;
  C=vec2(cos(uFase),sin(uFase));
  float esc=min(uRes.x,uRes.y);
  float px=1.1/esc;
  /* espessura das linhas proporcional ao tamanho: o desenho é o mesmo em 1x, 2x e no vídeo */
  float hw=max(.42,esc*.00042);

  /* corpo largo gravado, corpo médio gravado e um fio solto, em escalas diferentes */
  float tinta=gravura(corpoPx(fc,0.,1.,vec2(0.),.05,px),6.,hw);
  tinta=max(tinta,gravura(corpoPx(fc,1.7,1.35,vec2(2.3,-1.1),.026,px),4.,hw*.9));
  vec2 f3=corpoPx(fc,3.4,.8,vec2(-1.7,3.2),.0028,px);
  tinta=max(tinta,fio(f3.x,max(f3.y,0.))*smoothstep(.2,1.,f3.y)*.9);

  vec3 papel=vec3(.949,.937,.910);
  vec3 nanquim=vec3(.047,.047,.051);
  vec3 col=mix(papel,nanquim,tinta);
  /* vinheta muito leve e grão fino para o papel não ficar chapado */
  vec2 q=fc/uRes-.5; col*=1.-.05*dot(q,q);
  col+=(fract(52.9829189*fract(dot(fc,vec2(.06711056,.00583715))))-.5)*.006;
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;

  g.tintaGL = function (cv, op = {}) {
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
        gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uF, fase); gl.uniform1f(uE, eixo ?? op.eixo ?? .5);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  };
})(window);
