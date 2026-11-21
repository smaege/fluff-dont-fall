(() => {
  'use strict';
  const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const tau = Math.PI * 2;
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lens = 1.39;
  const flatPlane = [0, 0, 0];
  const unitSize = [1, 1, 1];
  const padHeight = window.FluffCourses.surfaceHeight;
  const vertex = `
    attribute vec3 position, normal;
    uniform vec3 loc, size, camera, rightDir, upDir, forwardDir;
    uniform vec2 lens; uniform float spin; uniform mat3 modelBasis; uniform vec3 modelBase;
    uniform vec3 padPlane,wingPose; uniform vec2 scarfSwing; uniform float material,pileLength;
    uniform float sceneTime;
    varying vec3 vNormal,vPos,vLocal,vFabric,vGrainNormal; varying float vDepth;
    void main(){
      ${window.FluffPetalRain.vertex}
      if(material== -18.){
        // Reconstruct the viewing ray for the polar sky on a single full-screen triangle.
        vPos=forwardDir+rightDir*position.x/lens.x+upDir*position.y/lens.y;
        gl_Position=vec4(position.xy,.9999,1.);
        return;
      }
      float c=cos(spin),s=sin(spin);
      mat3 rot=mat3(c,s,0.,-s,c,0.,0.,0.,1.);
      vec3 fit=size;
      if(material==3.4){
        float ease=smoothstep(-.34,.13,position.z/max(.0001,length(position.xz)));
        fit.xz*=1.+ease*vec2(.15,.18);
      }
      vec3 localNormal=normal;
      vec3 cut=position;
      if(material<= -12. && material>= -16.){
        // Flex increases out from the shoulder. Ribs, skin and surface markings bend together.
        float span=max(cut.x,0.);
        cut.y+=wingPose.z*span*span;
        localNormal.x-=2.*wingPose.z*span*localNormal.y;
        float ca=cos(wingPose.x),sa=sin(wingPose.x),cb=cos(wingPose.y),sb=sin(wingPose.y);
        mat3 hinge=mat3(cb*ca,sa,sb*ca, -cb*sa,ca,-sb*sa, -sb,0.,cb);
        cut=hinge*cut;
        localNormal=hinge*localNormal;
      }
      vGrainNormal=normalize(localNormal/fit);
      if(material== -8.){
        float loose=smoothstep(.092,.30,-position.y);
        cut.x+=scarfSwing.x*loose;
        cut.z-=scarfSwing.y*loose;
        cut.y+=scarfSwing.y*loose*.38;
      }
      if(material== -6.5){
        // Quills beneath a hat are pressed down under its brim.
        float rim=length(vec2(position.x/.25,(position.z+.087)/.35));
        cut.y-=.066*(1.-smoothstep(.65,1.3,rim))*smoothstep(.37,.48,cut.y);
      }
      vec3 world=modelBase+modelBasis*(loc+rot*(cut*fit + vGrainNormal*pileLength));
      world.y+=dot(padPlane,vec3(world.xz,1.));
      vec3 n=modelBasis*rot*(localNormal/fit);
      n.xz-=padPlane.xy*n.y;
      vNormal=normalize(n);vLocal=position;vPos=world;vFabric=position*size;
      vec3 d=world-camera;vDepth=dot(d,forwardDir);
      gl_Position=vec4(dot(d,rightDir)*lens.x,dot(d,upDir)*lens.y,1.001*vDepth-.12,vDepth);
    }`;
  const fragment = `
    precision highp float;
    #ifdef FLUFF_INSTANCED
      #define varying in
      #define texture2D texture
      out vec4 batchFragment;
      #define gl_FragColor batchFragment
      flat in vec3 batchColor;
      flat in float batchMaterial;
      #define color batchColor
      #define material batchMaterial
    #else
      uniform vec3 color;
      uniform float material;
    #endif
    varying vec3 vNormal,vPos,vLocal,vFabric,vGrainNormal; varying float vDepth;
    uniform sampler2D fleece, shortPile, knitLoops;
    uniform vec3 fog,clothTint,camera; uniform vec2 studioFeet; uniform float garment,pileLength;
    uniform float sceneTime;
    uniform vec2 portalMotion;
    uniform vec3 portalAccent;
    float hash(vec2 p){return fract(sin(dot(p,vec2(41.71,289.33)))*4375.76);}
    void main(){
      ${window.FluffPetalRain.fragment}
      if(material== -18.){
        vec3 ray=normalize(vPos);
        float a=atan(ray.x,ray.z+.00001), h=ray.y, t=sceneTime*.045;
        vec3 sky=mix(vec3(.56,.69,.79),vec3(.095,.13,.32),smoothstep(-.33,.38,h));
        vec2 grid=vec2((a/6.283185+.5)*240.,h*116.);
        vec2 tile=floor(grid), q=fract(grid)-.15-.7*vec2(hash(tile),hash(tile+9.));
        sky+=vec3(.7,.82,1.)*(1.-smoothstep(.013,.12,length(q)))*smoothstep(.79,.99,hash(tile+3.))*smoothstep(.015,.24,h);
        for(int i=0;i<2;i++){
          float k=float(i);
          float base=.13+.14*k+.082*sin(a*3.+k+t)+.055*sin(a*7.-k-t*.6);
          float above=h-base;
          float fold=a+ .043*sin(9.*a+t)+.015*sin(21.*a-t*.7)+above*.18;
          float stripes=.5+.31*sin(fold*103.)+.19*sin(fold*57.+t);
          float curtain=exp(-max(above,0.)*(11.+3.*sin(a*3.)))*smoothstep(-.026,.012,above);
          vec3 tint=mix(vec3(.25,.96,.73),vec3(.72,.54,.95),clamp(k*.77+above,0.,1.));
          sky=mix(sky,tint,curtain*(.3+.32*stripes)*(.75+.2*sin(a*4.+k)));
        }
        gl_FragColor=vec4(sky,1.);
        return;
      }
      if(material== -17. || material== -22.){
        vec2 p=vLocal.xy;
        float r=length(p), a=atan(p.y,p.x+.00001);
        float t=portalMotion.x, wake=portalMotion.y;
        vec3 silk=mix(portalAccent,vec3(1.,.96,.84),.58);
        float haze=min(.7,max(vDepth-8.,0.)*.017);
        if(material== -22.){
          float halo=exp(-111.*pow(abs(r-1.05),2.))*(1.-smoothstep(1.14,1.32,r));
          float light=.66+.34*cos(3.*a-t*.85);
          float alpha=halo*light*(.12+.10*wake)*(1.-haze);
          gl_FragColor=vec4(mix(color,silk,.42)*alpha,alpha);
          return;
        }
        // The wisps taper inward around the open sightline. The mesh curves away from the rim.
        float turn=3.*a-12.*r+.95*t+.6*sin(5.*r+a);
        float crossing=2.*a+13.*r-.65*t;
        float strand=pow(.5+.5*cos(turn),9.);
        float filament=pow(.5+.5*cos(turn+.24),62.);
        float lattice=pow(.5+.5*cos(crossing),14.)*
                      (.28+.72*smoothstep(-.55,.68,cos(turn-a)));
        float stitches=smoothstep(-.08,.64,cos(a*37.+r*29.-t*.73));
        float edge=exp(-34.*pow(abs(r-.91),2.));
        float aperture=smoothstep(.19,.72,r)*(1.-smoothstep(.94,1.,r));
        float mist=edge*(.14+.14*wake)*(.75+.25*cos(2.*a-4.*r-t*.4));
        float thread=aperture*(.66*strand+.43*lattice)*(.48+.52*stitches);
        float sheen=aperture*filament*(.17+.20*wake);
        vec3 dye=mix(color*.69,silk,smoothstep(.055,.53,thread+sheen*1.25));
        float alpha=clamp((mist+sheen+thread*(.53+.24*wake))*(1.-haze),0.,.86);
        gl_FragColor=vec4(mix(dye,fog,haze*.45)*alpha,alpha);
        return;
      }
      vec3 n=normalize(vNormal);
      bool body=material>2.5&&material<3.5;
      bool residentFace=material== -4.||material== -5.;
      bool mantle=material== -6. || material== -6.5;
      bool plush=body||mantle||material== -1.||residentFace;
      vec3 sun=normalize(vec3(-.58,.76,-.32));
      float incidence=dot(n,sun);
      if(material>=20. && material<23.){
        // The cover and darker inset side meet at a raised cord seam.
        float y=vLocal.y;
        vec3 dye=mix(color*vec3(.67,.62,.74),color,smoothstep(-.17,.27,y));
        float warning=clamp(material-22.,0.,1.);
        dye=mix(dye,vec3(.96,.36,.25),warning*.47);
        vec3 weights=pow(abs(n),vec3(4.));
        weights/=max(.01,weights.x+weights.y+weights.z);
        vec3 p=vFabric*.94;
        float nap=dot(weights,vec3(texture2D(shortPile,p.zy).r,texture2D(shortPile,p.xz).r,texture2D(shortPile,p.xy).r));
        float grazing=pow(1.-abs(dot(n,normalize(camera-vPos))),2.5);
        float light=.62+.42*smoothstep(-.90,.91,incidence)+.05*n.y;
        vec3 fabric=dye*light*(.84+.29*nap);
        fabric+=mix(dye,vec3(1.,.90,.83),.58)*grazing*.12;

        // Shallow quilting draws a diamond pattern across the broad top panel.
        vec2 uv=vec2(vFabric.x+vFabric.z,vFabric.x-vFabric.z)*.83;
        vec2 diamond=abs(fract(uv+.5)-.5);
        float channel=1.-smoothstep(.012,.065,min(diamond.x,diamond.y));
        float loft=sin(3.14159*diamond.x)*sin(3.14159*diamond.y);
        float top=smoothstep(.65,.94,n.y)*smoothstep(.44,.495,y);
        float detail=1.-smoothstep(16.,46.,vDepth);
        fabric*=1.+top*(loft*.043-channel*.10)*detail;
        if(material==21.){
          vec2 panel=abs(vLocal.xz);
          float tape=(1.-smoothstep(.009,.022,abs(panel.x-.365)))*(1.-smoothstep(.31,.42,panel.y));
          fabric=mix(fabric,vec3(.98,.79,.53)*light,tape*top*.79);
        }
        float angle=atan(vLocal.z,vLocal.x+.00001);
        vec3 thread=mix(dye,vec3(1.,.94,.81),.75);
        float groove=1.-smoothstep(.012,.034,abs(y-.198));
        float piping=1.-smoothstep(.013,.032,abs(y-.246));
        float runningStitch=cos(angle*55.+y*31.);
        float stitch=(1.-smoothstep(.012,.033,abs(y-.402)))*smoothstep(.17,.60,runningStitch);
        fabric=mix(fabric,fabric*.67,groove*.72);
        fabric=mix(fabric,thread*light,piping*(.71+.15*nap));
        fabric=mix(fabric,thread*(light+.12),stitch*.92*detail);
        float haze=1.-exp(-max(0.,vDepth-7.)*.011);
        gl_FragColor=vec4(mix(fabric,fog,min(haze,.87)),1.);
        return;
      }
      if(material== -21.){
        float a=atan(vLocal.y,vLocal.x+.00001), r=length(vLocal.xy);
        float t=portalMotion.x, wake=portalMotion.y;
        float weave=texture2D(knitLoops,vec2(a*6.04789,vLocal.z*7.5)).r;
        float nap=texture2D(shortPile,vLocal.xy*2.5).r;
        float lining=1.-smoothstep(.467,.539,r);
        float ridge=smoothstep(.14,.95,abs(n.z));
        vec3 velvet=mix(color*.66,color,lining*.8+.14*ridge);
        velvet*=.88+.18*weave+.08*nap;
        velvet*=.76+.33*smoothstep(-.88,.95,incidence);
        float band=.508+.016*cos(12.*a);
        float braid=1.-smoothstep(.003,.010,abs(r-band));
        float second=1.-smoothstep(.0025,.008,abs(r-band-.017));
        float stitch=smoothstep(-.25,.32,cos(84.*a+vLocal.z*8.));
        float current=pow(.5+.5*cos(4.*a-t*1.15),4.);
        vec3 thread=mix(portalAccent,vec3(1.,.92,.70),.54);
        float embroidery=max(braid*.86,second*(.28+.58*stitch))*ridge;
        vec3 woven=mix(velvet,thread*(.85+.15*stitch),embroidery);
        woven+=thread*(.13+.18*wake)*current*(lining+embroidery);
        gl_FragColor=vec4(mix(woven,fog,min(.87,max(vDepth-7.,0.)*.012)),1.);
        return;
      }
      if(material== -19.){
        vec3 eye=normalize(camera-vPos);
        float rim=pow(1.-abs(dot(n,eye)),2.);
        vec3 facet=color*(.64+.36*smoothstep(-.57,.92,incidence));
        facet+=vec3(.52,.85,.99)*(.11*rim+.19*pow(max(0.,dot(n,normalize(sun+eye))),12.));
        gl_FragColor=vec4(mix(facet,fog,min(.82,max(0.,vDepth-7.)*.011)),1.);
        return;
      }
      float light=.79+.24*dot(n,normalize(vec3(-.48,.85,-.35)));
      if(plush) light=.62+.43*smoothstep(-.92,1.,incidence)+.044*n.y;
      vec3 col=color*light;
      col+=vec3(.04,.024,.054)*(.5+.5*n.y);
      float clothCover=0.;
      if(body||mantle){
        // Project a quill onto the same sewing pattern as the garment covering its root.
        vec3 panel=vLocal;
        if(mantle){
          float radius=sqrt(max(.00001,.25-panel.y*panel.y))*(1.-.32*panel.y);
          panel.xz*=radius/max(.0001,length(panel.xz));
        }
        vec2 p=panel.xy;
        float front=smoothstep(.02,.20,-panel.z);
        if(!mantle && material!=3.48){
          // Slightly pinched closing seam in the two back fabric panels.
          float seam=p.x-.023*sin(p.y*6.+.34);
          float back=smoothstep(.15,.32,vLocal.z);
          float pinch=exp(-abs(seam)*128.);
          float stitchEdge=exp(-abs(abs(seam)-.009)*230.);
          col*=1.+back*(-.16*pinch+.043*stitchEdge);
          float pick=back*pinch*smoothstep(.12,.72,cos(p.y*246.+.6));
          col=mix(col,col*.72,pick*.49);
          float belly=length((p-vec2(0.,-.17))/vec2(.299,.24));
          col=mix(col,vec3(1.,.929,.795)*light,(1.-smoothstep(.982,1.01,belly))*front);
          float thread=(1.-smoothstep(.009,.025,abs(belly-.95)))*step(.05,sin(atan(p.y+.17,p.x)*55.));
          col=mix(col,vec3(.83,.74,.61)*light,thread*front*.56);
          if(material==3.25){
            vec2 lobe=vec2(abs(p.x)-.112,p.y-.074);
            lobe.x-=.19*lobe.y;
            float mask=length(lobe/vec2(.194,.186));
            float border=(1.-smoothstep(.004,.013,abs(mask-1.)))*front;
            col=mix(col,vec3(1.,.929,.795)*light,(1.-smoothstep(.985,1.015,mask))*front);
            float topEdge=smoothstep(.02,.11,p.y);
            col*=1.-.091*border*topEdge;
          }
        }
        if(garment>.5 && garment<1.5){
          float bib=(1.-smoothstep(.21,.225,abs(p.x)))*(1.-smoothstep(-.055,-.043,p.y));
          float strap=(1.-smoothstep(.025,.04,abs(abs(p.x)-.185-max(0.,p.y+.07)*1.35)))*(1.-smoothstep(.11,.14,p.y));
          float cloth=max(1.-smoothstep(-.25,-.24,p.y),max(bib,strap));
          clothCover=cloth;
          float around=atan(panel.x,panel.z+.0001);
          vec2 weave=texture2D(shortPile,vec2(around*.31831,p.y*1.75)).rb-.5;
          vec3 denim=clothTint*(.96+.07*weave.x+.115*weave.y);
          denim=mix(denim,clothTint*1.035,smoothstep(.25,.9,strap));
          // The bib and lower panels retain their topstitching beneath the raised pocket.
          float sideSeam=abs(abs(p.x)-.195);
          float bibEdge=max(1.-smoothstep(.002,.009,sideSeam),1.-smoothstep(.002,.01,abs(p.y+.068)));
          bibEdge*=smoothstep(-.25,-.224,p.y)*(1.-smoothstep(-.056,-.05,p.y))*bib;
          float threadPath=mix(p.x,p.y,smoothstep(.168,.196,abs(p.x)));
          float bibStitch=bibEdge*mix(.42,1.,smoothstep(-.25,.45,cos(threadPath*160.)));
          float waist=(1.-smoothstep(.003,.01,abs(p.y+.258)))*(1.-.78*bib);
          float backRise=smoothstep(.04,.25,panel.z)*(1.-smoothstep(.003,.009,abs(p.x)));
          denim*=1.-.12*waist-.086*backRise;
          vec3 topstitch=mix(clothTint,vec3(.95,.76,.54),.7);
          denim=mix(denim,topstitch,bibStitch*.59);
          denim=mix(denim,topstitch,waist*.48*mix(.32,1.,smoothstep(-.2,.48,cos(around*76.))));
          col=mix(col,denim*light,cloth);
        }else if(garment>1.5 && garment<2.5){
          // The physical wrap hides the quills it compresses underneath.
          float angle=atan(panel.x,-panel.z);
          float center=-.059+.023*sin(angle+.26)+.034*(1.-cos(angle));
          clothCover=1.-smoothstep(.052,.058,abs(p.y-center));
        }else if(garment>2.5 && garment<3.5){
          float coat=smoothstep(-.42,-.409,p.y)*(1.-smoothstep(-.031,-.012,p.y));
          clothCover=coat;
          vec3 halfLight=normalize(sun+normalize(camera-vPos));
          float gloss=pow(max(0.,dot(n,halfLight)),12.);
          float placket=front*(1.-smoothstep(.023,.036,abs(p.x)));
          float placketEdge=front*(1.-smoothstep(.002,.009,abs(abs(p.x)-.026)));
          float tapedHem=1.-smoothstep(.002,.01,abs(p.y+.379-.017*panel.x*panel.x));
          float boundNeck=1.-smoothstep(.004,.016,abs(p.y+.046));
          float sideSeam=(1.-smoothstep(.012,.026,abs(panel.z+.011)))
                         *smoothstep(.17,.34,abs(p.x));
          vec3 coatedCloth=clothTint*(1.+.075*placket-.12*placketEdge-.09*tapedHem-.09*sideSeam);
          coatedCloth=mix(coatedCloth,mix(clothTint,vec3(1.,.94,.86),.25),boundNeck*.52);
          col=mix(col,coatedCloth*light+vec3(1.,.91,.77)*(.13*gloss),coat);
        }else if(garment>3.5 && garment<4.5){
          float around=atan(panel.x,panel.z+.0001);
          float frontCape=smoothstep(-.82,.62,-cos(around));
          float neckline=mix(.18,.016,frontCape);
          float hem=mix(-.43,-.108,frontCape)-.016*pow(.5+.5*cos(around*12.),2.);
          float cape=smoothstep(hem-.008,hem+.008,p.y)*(1.-smoothstep(neckline,neckline+.012,p.y));
          clothCover=cape;
          float hanging=smoothstep(.027,.34,neckline-p.y);
          float fold=sin(around*10.+p.y*2.+.42*sin(around*3.));
          float velvet=1.+hanging*(.12*fold-.13*pow(.5-.5*fold,3.));
          float facing=abs(dot(n,normalize(camera-vPos)));
          vec3 nap=mix(clothTint,vec3(.95,.86,.96),.42)*pow(max(0.,1.-facing),2.4);
          vec3 velvetDye=clothTint*velvet+.23*nap;
          float hemDistance=p.y-hem;
          float collarDistance=neckline-p.y;
          float piping=max(1.-smoothstep(.012,.023,hemDistance),1.-smoothstep(.021,.033,collarDistance));
          float raisedCord=max(1.-smoothstep(.002,.010,abs(hemDistance-.008)),
                               1.-smoothstep(.002,.013,abs(collarDistance-.011)));
          float braid=smoothstep(-.48,.55,cos(around*93.+p.y*102.));
          vec3 gold=mix(vec3(.68,.43,.22),vec3(.98,.77,.43),.29+.54*raisedCord+.11*braid);
          col=mix(col,mix(velvetDye,gold,piping)*light,cape);
        }else if(garment>4.5){
          float back=smoothstep(.03,.29,panel.z);
          float neckline=-.05+.27*min(abs(p.x),.34)+.09*back;
          float hem=-.395+.1*p.x*p.x;
          float jacket=smoothstep(hem-.01,hem,p.y)*(1.-smoothstep(neckline,neckline+.012,p.y));
          clothCover=jacket;
          float around=atan(panel.x,panel.z+.0001);
          vec2 grain=texture2D(shortPile,vec2(around*1.90986,p.y*5.5)).rg;
          float sidePanel=abs(p.x)-.277-.16*(p.y+.16)*abs(p.y+.16);
          float panels=1.-smoothstep(.002,.009,abs(sidePanel));
          float yokeLine=p.y+.112-.21*abs(p.x);
          float yokeSeam=back*(1.-smoothstep(.003,.012,abs(yokeLine)));
          float yoke=back*smoothstep(-.012,.022,yokeLine);
          float shine=pow(max(0.,dot(n,normalize(sun+normalize(camera-vPos)))),8.);
          vec3 leather=clothTint*(.96+.12*(grain.g-.5)-.15*panels-.16*yokeSeam+.10*yoke);
          leather+=mix(clothTint,vec3(1.,.84,.66),.43)*(.13*shine);
          float seamStitch=max(back*(1.-smoothstep(.002,.007,abs(yokeLine+.012)))
                               *smoothstep(-.3,.45,cos(around*58.)),
                               (1.-smoothstep(.002,.007,abs(sidePanel+.012)))*smoothstep(-.3,.45,cos(p.y*180.)));
          leather=mix(leather,mix(clothTint,vec3(.95,.77,.57),.55),seamStitch*.59);
          float cuffDistance=min(p.y-hem,(neckline-p.y)-.016);
          float shearling=1.-smoothstep(.035,.050,cuffDistance+.019*(grain.g-.5));
          vec3 wool=vec3(.99,.89,.75)*(.85+.18*grain.r+.075*grain.g);
          wool*=.88+.12*smoothstep(-.007,.022,cuffDistance);
          vec3 hide=mix(leather,wool,shearling);
          float zipper=front*(1.-smoothstep(.008,.015,abs(p.x)));
          float teeth=(1.-smoothstep(.004,.008,abs(p.x)))*smoothstep(-.3,.48,cos(p.y*250.));
          hide=mix(hide,mix(clothTint*.57,vec3(.91,.7,.42),teeth),zipper);
          col=mix(col,hide*light,jacket);
        }
        if(mantle && (clothCover>.48 || (garment>2.5 && p.y<-.38))) discard;
        if(material==3.4 && (clothCover<.48 || panel.z<-.14)) discard;
      }
      bool stitchedPanel=material>.5&&material<1.5;
      bool diagonalStripe=material>1.5&&material<2.5;
      bool boundRoll=material>5.5&&material<6.5;
      float fabricDetail=1.-smoothstep(14.,43.,vDepth);
      if(stitchedPanel){
        // The facing panel is bordered on the sides as well as on top.
        vec3 p=abs(vLocal);
        float along=min(p.x,min(p.y,p.z));
        float edge=max(min(p.x,p.y),max(min(p.x,p.z),min(p.y,p.z)));
        float inset=1.-smoothstep(.016,.045,abs(edge-.419));
        float stitch=1.-smoothstep(.006,.019,abs(edge-.437));
        float cord=smoothstep(-.12,.46,cos(along*145.));
        col*=1.-.14*inset;
        vec3 thread=mix(color,vec3(1.,.95,.81),.71)*light;
        col=mix(col,thread,stitch*(.14+.51*cord*fabricDetail));
      }
      if(diagonalStripe){
        float wave=sin(vLocal.y*21.+vLocal.x*9.);
        float stripe=smoothstep(-.08,.08,wave);
        float binding=1.-smoothstep(.08,.27,abs(wave));
        col=mix(col,vec3(1.,.91,.84)*light,stripe*.85);
        col*=1.-.10*binding*fabricDetail;
      }
      if(boundRoll){
        float wave=cos(vLocal.x*69.115);
        float stripe=smoothstep(-.12,.12,wave);
        float binding=1.-smoothstep(.12,.34,abs(wave));
        vec3 tape=vec3(1.,.88,.68)*light;
        col=mix(col,tape,stripe*.93);
        col*=1.-.12*binding*fabricDetail;
      }
      if(material>8.5&&material<9.5){
        float t=vLocal.z+.5;
        float arc=sin(3.141593*t);
        float curve=.14+material-9.;
        float u=vLocal.x-curve*sin(6.283185*t)*arc*arc;
        float band=clamp((u+.44)*7./.88,0.,6.999);
        vec3 dye=vec3(.94,.44,.53);
        dye=mix(dye,vec3(1.,.66,.39),smoothstep(.96,1.04,band));
        dye=mix(dye,vec3(1.,.86,.48),smoothstep(1.96,2.04,band));
        dye=mix(dye,vec3(.51,.84,.64),smoothstep(2.96,3.04,band));
        dye=mix(dye,vec3(.40,.78,.83),smoothstep(3.96,4.04,band));
        dye=mix(dye,vec3(.54,.66,.94),smoothstep(4.96,5.04,band));
        dye=mix(dye,vec3(.77,.55,.86),smoothstep(5.96,6.04,band));
        dye=mix(dye,vec3(1.,.89,.76),smoothstep(.445,.474,abs(u)));
        float stitches=(1.-smoothstep(.002,.005,abs(abs(u)-.42)))*smoothstep(-.3,.3,cos(t*390.));
        col=mix(dye,vec3(1.,.97,.86),stitches*.91)*light;
      }
      if(material>=10.){
        float lit=floor((material-10.)*10.+.5);
        float slot=floor(vLocal.x*9.+2.5);
        float localX=(vLocal.x-(slot-2.)/9.)*3.14;
        float topSpot=length(vec2(localX,(vLocal.z+.22)));
        float faceSpot=length(vec2(localX,(vLocal.y+.025)*.39));
        float spot=mix(faceSpot,topSpot,smoothstep(.15,.8,n.y));
        float visible=step(-.1,slot)*(1.-step(4.9,slot))*max(smoothstep(.6,.9,n.y),smoothstep(.6,.9,-n.z));
        vec3 button=slot<lit?vec3(1.,.97,.70):color*.61;
        col=mix(col,color*.67,(1.-smoothstep(.067,.079,spot))*visible);
        col=mix(col,button*light,(1.-smoothstep(.052,.063,spot))*visible);
      }
      float nap=.5;
      if(plush){
        // Fabric-space fibres turn with the character and stay attached during animation.
        vec3 grain=pow(abs(normalize(vGrainNormal)),vec3(4.));
        grain/=max(.001,grain.x+grain.y+grain.z);
        vec3 p=vFabric*1.38;
        vec2 fibre=texture2D(shortPile,p.zy).rg*grain.x
                  +texture2D(shortPile,p.xz).rg*grain.y
                  +texture2D(shortPile,p.xy).rg*grain.z;
        vec3 eyeDir=normalize(camera-vPos);
        float viewIncidence=dot(n,eyeDir);
        float facing=min(1.,abs(viewIncidence));
        if(pileLength>0. && (clothCover>.4 || facing>.31 || fibre.x<.47+.39*facing)) discard;
        float alongNap=eyeDir.y-n.y*viewIncidence;
        float napSheen=smoothstep(-.32,.57,alongNap+(fibre.y-.5)*.62);
        float pile=(fibre.x-.5)*mix(.34,.57,napSheen)+(fibre.y-.5)*.13;
        col*=1.+pile*mix(1.,.29,clothCover);
        float velvet=pow(1.-facing,2.6)*(.55+.45*smoothstep(-.8,.8,incidence));
        float fibreGlow=velvet*(.115+.16*fibre.x)+napSheen*(.026+.085*velvet);
        col+=mix(color,vec3(1.,.91,.89),.65)*fibreGlow*(1.-.64*clothCover);
        if(residentFace){
          // Embroider the villagers' features directly on their rounded heads.
          vec2 uv=vLocal.xy;
          vec2 eye=vec2(abs(uv.x)-.209,uv.y-.095);
          float front=smoothstep(.08,.23,-vLocal.z);
          float eyeShape=1.-smoothstep(.91,1.06,length(eye/vec2(.067,.102)));
          vec2 glint=vec2(uv.x-sign(uv.x)*.209+.021,eye.y-.037);
          float shine=1.-smoothstep(.83,1.12,length(glint/vec2(.018,.025)));
          float cheek=1.-smoothstep(.68,1.06,length((eye-vec2(.093,-.17))/vec2(.08,.052)));
          col=mix(col,vec3(.95,.56,.64),.76*front*cheek);
          float smile=0.;
          if(material== -4.) smile=(1.-smoothstep(.009,.022,abs(uv.y+.128-4.*uv.x*uv.x)))
            *(1.-smoothstep(.050,.076,abs(uv.x)));
          col=mix(col,vec3(.249,.184,.244)*(.88+.15*light),front*max(eyeShape,smile));
          col=mix(col,vec3(1.,.95,.87),front*shine);
        }
      }else if(material<= -12. && material>= -16.){
        // Light carries through the thin panels; the denser leading edges retain a darker profile.
        vec3 viewDir=normalize(camera-vPos);
        float edge=pow(1.-min(1.,abs(dot(viewDir,n))),2.4);
        float wrap=smoothstep(-.95,.98,incidence);
        float satin=texture2D(shortPile,vLocal.xy*1.4).b-.5;
        if(material== -12.){
          vec2 ray=vLocal.xy-vec2(.45,.535);
          float spread=smoothstep(.12,.82,length(ray));
          float tension=.5+.5*cos(atan(ray.y,ray.x+.00001)*43.+3.8*length(ray));
          float transmission=.050*max(0.,-incidence)+.063*edge+.039*spread;
          vec3 hide=color*(.76+.245*wrap+.023*satin+.036*spread*tension);
          col=hide+vec3(1.,.70,.76)*transmission;
        }else if(material== -13.){
          float ridge=pow(max(0.,dot(n,normalize(sun+viewDir))),18.);
          col=color*(.67+.35*wrap)+vec3(1.,.84,.77)*ridge*.084;
        }else if(material== -14.){
          col=color*(.77+.25*wrap+.032*satin)+vec3(1.,.95,.88)*.07*edge;
        }else if(material== -15.){
          col=color*(.82+.20*wrap+.039*satin)+vec3(.96,.81,.93)*.047*edge;
        }else{
          col=color*(.88+.15*wrap)+mix(vec3(.76,.91,1.),color,.25)*(.037+.095*edge);
        }
      }else if(material== -7. || material== -8. || material== -10. || material== -11.){
        // Mipmapped stockinette loops keep their yarn structure as the camera pulls back.
        vec2 yarnUV=vec2(vLocal.x*5.9,vLocal.y*9.0);
        if(material== -7.) yarnUV.x=atan(vLocal.x,-vLocal.z)*1.63;
        if(material== -10.) yarnUV=vec2(vLocal.y*5.8+vLocal.x*1.4,-vLocal.x*7.);
        if(material== -11.) yarnUV=vec2(atan(vLocal.x,-vLocal.z)*1.43,vFabric.y*8.);
        float yarn=texture2D(knitLoops,yarnUV).r;
        float nap=texture2D(shortPile,vFabric.xy*1.6).r;
        col=color*(.72+.31*smoothstep(-.85,.94,incidence))*(.73+.45*yarn+.055*nap);
        col+=.039*vec3(1.,.87,.87)*pow(1.-abs(dot(n,normalize(camera-vPos))),2.);
      }else if(material== -9.){
        float grain=texture2D(shortPile,vFabric.xy*2.0).b;
        col=color*(.72+.34*smoothstep(-.85,.94,incidence))*(.958+.083*grain);
      }else if(material>9.7 && material<9.8){
        float satin=texture2D(shortPile,vFabric.xy*2.).b;
        col=color*(.86+.15*light)+mix(color,vec3(.94,.85,.91),.32)*(.018+.059*satin);
      }else if(stitchedPanel||diagonalStripe||boundRoll){
        // A tight, mipmapped weave carries through the dyed sections and wrapped bands.
        vec3 axis=abs(normalize(vGrainNormal));
        vec3 weights=axis*axis;
        weights*=weights;
        weights/=max(.001,weights.x+weights.y+weights.z);
        vec3 p=vFabric*.77;
        vec3 weave=texture2D(shortPile,p.zy).rgb*weights.x
                  +texture2D(shortPile,p.xz).rgb*weights.y
                  +texture2D(shortPile,p.xy).rgb*weights.z;
        col*=1.+(weave.r-.5)*.23+(weave.g-.5)*.11+(weave.b-.5)*.12;
        float grazing=1.-min(1.,abs(dot(n,normalize(camera-vPos))));
        col+=mix(color,vec3(1.,.91,.81),.55)*(.06*grazing*grazing)*(.65+.7*weave.b);
      }else{
        vec3 weights=pow(abs(n),vec3(4.));weights/=max(.01,weights.x+weights.y+weights.z);
        nap=dot(weights,vec3(texture2D(fleece,vFabric.zy*1.65).r,texture2D(fleece,vFabric.xz*1.65).r,texture2D(fleece,vFabric.xy*1.65).r));
        col*=.81+nap*.38;
        col+=.03*pow(1.-abs(dot(n,normalize(vec3(-.3,.5,-.7)))),4.);
        if(material== -3.){
          float bodyShade=exp(-dot(vLocal.xz*vLocal.xz,vec2(14.,19.)));
          vec2 foot=vec2(abs(vLocal.x),vLocal.z)-studioFeet;
          float contact=exp(-dot(foot*foot,vec2(135.,96.)));
          col=mix(col,vec3(.54,.41,.44),.37*bodyShade+.39*contact);
        }
      }
      float haze=1.-exp(-max(0.,vDepth-7.)*.011);
      bool badge=material>6.5&&material<7.5;
      if(badge){
        vec2 p=vLocal.xy;
        float radius=length(p);
        float lightness=.89+.13*n.y;
        vec3 edge=vec3(.035,.32,.33);
        vec3 face=color*(.91+nap*.16);
        col=mix(face,edge,smoothstep(.437,.49,radius))*lightness;
        float angle=atan(p.y,p.x+.0001);
        float stitch=(1.-smoothstep(.010,.026,abs(radius-.396)))*smoothstep(-.28,.05,sin(angle*29.));
        col=mix(col,vec3(.74,1.,.91),stitch*.85);
        vec2 q=vec2(abs(p.x),p.y);
        float pad=length((p-vec2(0.,-.105))/vec2(.195,.145));
        float inner=length((q-vec2(.076,.155))/vec2(.064,.085));
        vec2 toe=q-vec2(.207,.048);
        toe=vec2(.86*toe.x+.51*toe.y,-.51*toe.x+.86*toe.y);
        float outer=length(toe/vec2(.060,.079));
        float paw=1.-smoothstep(.89,1.05,min(pad,min(inner,outer)));
        float thread=.91+.09*smoothstep(-.6,.45,sin((p.x+p.y*.72)*330.));
        col=mix(col,vec3(1.,.985,.86)*thread,paw);
      }
      gl_FragColor=vec4(mix(col,fog,min(haze,badge?.33:.87)),1.);
    }`;
  function roundedBox() {
    const out = [],
      stops = [-0.5, -0.486, -0.453, -0.405, -0.35, 0.35, 0.405, 0.453, 0.486, 0.5];
    function corner(axis, sign, a, b) {
      const p = [0, 0, 0];
      p[axis] = sign * 0.5;
      p[(axis + 1) % 3] = a;
      p[(axis + 2) % 3] = b;
      const core = p.map((v) => clamp(v, -0.35, 0.35)),
        d = p.map((v, i) => v - core[i]),
        length = Math.hypot(...d);
      const n = d.map((v) => v / length);
      return [...core.map((v, i) => v + n[i] * 0.15), ...n];
    }
    for (let axis = 0; axis < 3; axis++)
      for (const sign of [-1, 1]) {
        for (let i = 0; i < stops.length - 1; i++)
          for (let j = 0; j < stops.length - 1; j++) {
            const a = corner(axis, sign, stops[i], stops[j]),
              b = corner(axis, sign, stops[i + 1], stops[j]),
              c = corner(axis, sign, stops[i + 1], stops[j + 1]),
              d = corner(axis, sign, stops[i], stops[j + 1]);
            out.push(...a, ...b, ...c, ...a, ...c, ...d);
          }
      }
    return out;
  }
  function sphere(columns = 20, rows = 14) {
    const out = [];
    function point(i, j) {
      const a = (i * tau) / columns,
        b = (j * Math.PI) / rows - Math.PI / 2,
        n = [Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)];
      return [...n.map((v) => v * 0.5), ...n];
    }
    for (let i = 0; i < columns; i++)
      for (let j = 0; j < rows; j++) {
        const a = point(i, j),
          b = point(i + 1, j),
          c = point(i + 1, j + 1),
          d = point(i, j + 1);
        out.push(...a, ...b, ...c, ...a, ...c, ...d);
      }
    return out;
  }
  function cylinder() {
    const out = [];
    const point = (x, angle) => {
      const y = Math.cos(angle),
        z = Math.sin(angle);
      return [x, y / 2, z / 2, 0, y, z];
    };
    for (let i = 0; i < 24; i++) {
      const a = (i * tau) / 24;
      const b = ((i + 1) * tau) / 24;
      const leftA = point(-0.5, a),
        rightA = point(0.5, a);
      const leftB = point(-0.5, b),
        rightB = point(0.5, b);
      out.push(...leftA, ...leftB, ...rightA, ...rightA, ...leftB, ...rightB);
    }
    return out;
  }
  function badgeMesh() {
    const out = [];
    const profile = [
      // Radius, depth, and the radial and depth components of the normal.
      [0, 0.5, 0, 1],
      [0.36, 0.44, 0.08, 0.997],
      [0.445, 0.36, 0.24, 0.971],
      [0.485, 0.23, 0.65, 0.76],
      [0.5, 0, 1, 0],
      [0.485, -0.23, 0.65, -0.76],
      [0.445, -0.36, 0.24, -0.971],
      [0.36, -0.44, 0.08, -0.997],
      [0, -0.5, 0, -1],
    ];
    function point(ring, segment) {
      const [r, z, nr, nz] = profile[ring];
      const angle = (segment * tau) / 36;
      const x = Math.cos(angle),
        y = Math.sin(angle);
      return [r * x, r * y, z, nr * x, nr * y, nz];
    }
    for (let i = 0; i < 36; i++) {
      for (let j = 0; j < profile.length - 1; j++) {
        const a = point(j, i),
          b = point(j + 1, i),
          c = point(j + 1, i + 1),
          d = point(j, i + 1);
        out.push(...a, ...b, ...c, ...a, ...c, ...d);
      }
    }
    return out;
  }
  // A surface of revolution gives the toy a continuous, tapered silhouette.
  function plushMesh(taper) {
    const vertices = [];
    const radius = (y) => Math.sqrt(Math.max(0, 0.25 - y * y)) * (1 - taper * y);
    function point(column, row) {
      const azimuth = (column * tau) / 48;
      const y = Math.sin((row * Math.PI) / 36 - Math.PI / 2) / 2;
      const r = radius(y);
      const slope = (radius(Math.min(0.5, y + 0.0001)) - radius(Math.max(-0.5, y - 0.0001))) / 0.0002;
      const scale = Math.hypot(1, slope);
      return [
        r * Math.cos(azimuth),
        y,
        r * Math.sin(azimuth),
        Math.cos(azimuth) / scale,
        -slope / scale,
        Math.sin(azimuth) / scale,
      ];
    }
    for (let i = 0; i < 48; i++)
      for (let j = 0; j < 36; j++) {
        const a = point(i, j),
          b = point(i + 1, j),
          c = point(i + 1, j + 1),
          d = point(i, j + 1);
        vertices.push(...a, ...b, ...c, ...a, ...c, ...d);
      }
    return vertices;
  }
  function curvedVertex(surface, u, v, facing = 1) {
    const p = surface(u, v);
    const u0 = surface(u - 0.0001, v),
      u1 = surface(u + 0.0001, v),
      v0 = surface(u, v - 0.0001),
      v1 = surface(u, v + 0.0001);
    const [ux, uy, uz] = u1.map((value, i) => value - u0[i]);
    const [vx, vy, vz] = v1.map((value, i) => value - v0[i]);
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    const length = Math.hypot(...n);
    return [...p, ...(length ? n.map((value) => (value / length) * facing) : [0, 0, facing])];
  }
  // Rounded outline for the three sewn layers of the same ear.
  const earOutline = [
    [-0.45, -0.43],
    [-0.49, -0.33],
    [-0.43, -0.09],
    [-0.25, 0.22],
    [-0.065, 0.47],
    [0.016, 0.49],
    [0.1, 0.42],
    [0.29, 0.17],
    [0.44, -0.08],
    [0.49, -0.34],
    [0.4, -0.44],
    [0, -0.49],
  ];
  function earEdge(t) {
    const count = earOutline.length;
    const section = Math.floor(t * count);
    const f = t * count - section;
    const [a, b, c, d] = [-1, 0, 1, 2].map((i) => earOutline[(section + i + count) % count]);
    return b.map((value, i) => {
      const slope = c[i] - a[i];
      const curve = 2 * a[i] - 5 * value + 4 * c[i] - d[i];
      const bend = 3 * (value - c[i]) + d[i] - a[i];
      return value + 0.5 * f * (slope + f * (curve + f * bend));
    });
  }
  function sewnEarMeshes() {
    const shell = [],
      lining = [],
      stitches = [];
    const depth = (x, y) => 0.22 * x + 0.24 * y;
    const point = (t, r, z) => {
      const [edgeX, edgeY] = earEdge(t);
      const x = edgeX * r,
        y = -0.13 + (edgeY + 0.13) * r;
      return [x, y, z + depth(x, y)];
    };
    const front = (t, r) => point(t, r, -0.18 - 0.29 * r ** 2 + 0.4 * r ** 10);
    const back = (t, r) => point(t, r, -0.07 + 0.56 * Math.sqrt(Math.max(0, 1 - r * r)));
    const centerNormal = Math.hypot(0.22, 0.24, 1);
    const facingFront = (t, r) =>
      r
        ? curvedVertex(front, t, r, -1)
        : [...front(t, 0), 0.22 / centerNormal, 0.24 / centerNormal, -1 / centerNormal];
    const facingBack = (t, r) =>
      r
        ? curvedVertex(back, t, r)
        : [...back(t, 0), -0.22 / centerNormal, -0.24 / centerNormal, 1 / centerNormal];
    const quad = (out, a, b, c, d) => out.push(...a, ...c, ...b, ...a, ...d, ...c);
    const rings = [0, 0.18, 0.35, 0.5, 0.63, 0.73, 0.82, 0.9, 0.956, 0.987, 1];
    for (let i = 0; i < 48; i++) {
      const left = i / 48,
        right = (i + 1) / 48;
      for (let j = 0; j < rings.length - 1; j++) {
        const inner = rings[j],
          outer = rings[j + 1];
        quad(
          inner < 0.73 ? lining : shell,
          facingFront(left, inner),
          facingFront(right, inner),
          facingFront(right, outer),
          facingFront(left, outer),
        );
        quad(
          shell,
          facingBack(right, inner),
          facingBack(left, inner),
          facingBack(left, outer),
          facingBack(right, outer),
        );
      }
    }
    const thread = (t, r) => {
      const v = facingFront(t, r);
      return v.map((value, i) => (i < 3 ? value + v[i + 3] * 0.009 : value));
    };
    for (let i = 0; i < 26; i++) {
      const a = i / 26,
        b = (i + 0.54) / 26;
      quad(stitches, thread(a, 0.792), thread(b, 0.806), thread(b, 0.835), thread(a, 0.821));
    }
    return { 'sewn-ear': shell, 'ear-lining': lining, 'ear-stitches': stitches };
  }
  function quillMesh() {
    const shaft = [],
      tip = [];
    const point = (u, v) => {
      const t = clamp(v, 0, 1);
      const radius = (0.47 + 0.19 * t) * (1 - t ** 3) ** 0.72;
      return [radius * Math.cos(u), t, 0.64 * t * t - radius * Math.sin(u)];
    };
    const tipStart = 0.72;
    const rings = [0.29, tipStart, 0.93];
    for (let i = 0; i < 6; i++) {
      const u0 = (i * tau) / 6,
        u1 = ((i + 1) * tau) / 6;
      let a = curvedVertex(point, u0, 0),
        b = curvedVertex(point, u1, 0);
      for (const v of rings) {
        const c = curvedVertex(point, u1, v),
          d = curvedVertex(point, u0, v);
        const section = v > tipStart ? tip : shaft;
        section.push(...a, ...b, ...c, ...a, ...c, ...d);
        a = d;
        b = c;
      }
      tip.push(...a, ...b, 0, 1, 0.64, 0, 1, 0);
    }
    return [shaft, tip];
  }
  function hedgehogMeshes([shaft, tip]) {
    const cap = [],
      shades = [[], [], []];
    const lower = -0.96,
      upper = Math.PI / 2;
    const arc = (v) => 1.65 + 0.23 * Math.max(0, Math.sin(v)) - 0.51 * Math.max(0, -Math.sin(v));
    const point = (u, v) => {
      const angle = arc(v) * u;
      const y = 0.5 * Math.sin(v),
        radius = 0.5 * Math.cos(v) * (1 - 0.32 * y);
      const cushion =
        0.15 *
        Math.max(0, Math.cos((u * Math.PI) / 2)) *
        clamp((v - lower) / 0.38, 0, 1) *
        clamp((upper - v) / 0.54, 0, 1);
      const padding = 0.984 + cushion;
      return [Math.sin(angle) * radius * padding, y * padding, Math.cos(angle) * radius * padding];
    };
    for (let i = 0; i < 36; i++)
      for (let j = 0; j < 26; j++) {
        const u0 = (2 * i) / 36 - 1,
          u1 = (2 * (i + 1)) / 36 - 1;
        const v0 = lower + ((upper - lower) * j) / 26;
        const v1 = Math.min(upper - 0.00001, lower + ((upper - lower) * (j + 1)) / 26);
        const a = curvedVertex(point, u0, v0),
          b = curvedVertex(point, u1, v0),
          c = curvedVertex(point, u1, v1),
          d = curvedVertex(point, u0, v1);
        cap.push(...a, ...b, ...c, ...a, ...c, ...d);
      }
    // Pack the roots along alternating rows and let the quills sweep toward the rump.
    let seed = 1769;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    const rows = 16;
    for (let row = 0; row < rows; row++) {
      const height = -0.82 + (2.22 * row) / (rows - 1);
      const spread = 0.97 - 0.32 * Math.max(0, -height) - 0.53 * Math.max(0, height - 0.83);
      const count = Math.round((arc(height) * spread * Math.cos(height)) / 0.051);
      for (let i = 0; i < count; i++) {
        const offset = (row % 2 ? 0.73 : 0.27) + 0.54 * (random() - 0.5);
        const u = ((2 * (i + offset)) / count - 1) * spread;
        const v = height + 0.1 * (random() - 0.5);
        const root = point(u, v);
        const yaw = arc(v) * u + 0.16 * u + 0.42 * (random() - 0.5);
        const a = Math.sin(yaw),
          b = Math.cos(yaw);
        const pitch = v + 0.46 + 0.11 * Math.abs(u) + 0.23 * (random() - 0.5);
        const c = Math.sin(pitch),
          d = Math.cos(pitch);
        const axis = [a * c, -d, b * c];
        const tangent = [-b, 0, a],
          sweep = [a * d, c, b * d];
        const diameter = 0.017 + 0.012 * random();
        const length = (0.151 + 0.068 * random()) * (1 - 0.26 * Math.max(0, -v));
        const baseShade = random() < 0.72 ? 0 : 1;
        const tipShade = random() < 0.7 ? baseShade + 1 : baseShade;
        for (const [section, shade] of [
          [shaft, shades[baseShade]],
          [tip, shades[tipShade]],
        ]) {
          for (let j = 0; j < section.length; j += 6) {
            const x = section[j] * diameter,
              y = (section[j + 1] - 0.14) * length,
              z = section[j + 2] * diameter - 0.007;
            const nx = section[j + 3] / diameter,
              ny = section[j + 4] / length,
              nz = section[j + 5] / diameter;
            for (let k = 0; k < 3; k++)
              shade.push(root[k] + tangent[k] * x + axis[k] * y + sweep[k] * z);
            const norm = Math.hypot(nx, ny, nz);
            for (let k = 0; k < 3; k++)
              shade.push((tangent[k] * nx + axis[k] * ny + sweep[k] * nz) / norm);
          }
        }
      }
    }
    return { 'quill-cap': cap, 'quills-0': shades[0], 'quills-1': shades[1], 'quills-2': shades[2] };
  }
  function flatTriangle(out, a, b, c) {
    const u = b.map((v, i) => v - a[i]),
      v = c.map((w, i) => w - a[i]);
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(...n) || 1;
    const norm = n.map((w) => w / len);
    for (const p of [a, b, c]) out.push(...p, ...norm);
  }
  function iceSpire() {
    const out = [];
    const ring = (i, height, radius) => {
      const a = (tau * i) / 6 + 0.27;
      return [Math.cos(a) * radius, height, Math.sin(a) * radius];
    };
    for (let i = 0; i < 6; i++) {
      const a = ring(i, 0, 0.45),
        b = ring(i + 1, 0, 0.45);
      const c = ring(i, 0.69, 0.5),
        d = ring(i + 1, 0.69, 0.5);
      flatTriangle(out, a, c, d);
      flatTriangle(out, a, d, b);
      flatTriangle(out, c, [0.07, 1, -0.04], d);
    }
    return out;
  }
  function star() {
    const out = [];
    const ring = Array.from({ length: 10 }, (_, i) => {
      const a = Math.PI / 2 + (i * Math.PI) / 5,
        r = i % 2 ? 0.27 : 0.5;
      return [Math.cos(a) * r, Math.sin(a) * r];
    });
    for (let i = 0; i < 10; i++) {
      const a = ring[i],
        b = ring[(i + 1) % 10];
      flatTriangle(out, [0, 0, -0.34], [...b, -0.05], [...a, -0.05]);
      flatTriangle(out, [0, 0, 0.34], [...a, 0.05], [...b, 0.05]);
      flatTriangle(out, [...a, -0.05], [...b, -0.05], [...a, 0.05]);
      flatTriangle(out, [...b, -0.05], [...b, 0.05], [...a, 0.05]);
    }
    return out;
  }
  function pickupRing() {
    const out = [];
    const point = (arc, i, j) => {
      const a = (arc * tau) / 3 + (i * 0.92 * tau) / 96;
      const b = (j * tau) / 6;
      const width = 0.018 * (0.22 + 0.78 * Math.sin((Math.PI * i) / 32));
      const c = Math.cos(a),
        s = Math.sin(a);
      const nx = Math.cos(b),
        nz = Math.sin(b);
      const radius = 0.48 + width * nx;
      return [radius * c, radius * s, width * nz, nx * c, nx * s, nz];
    };
    for (let arc = 0; arc < 3; arc++) {
      for (let i = 0; i < 32; i++) {
        for (let j = 0; j < 6; j++) {
          const a = point(arc, i, j),
            b = point(arc, i + 1, j);
          const c = point(arc, i + 1, j + 1),
            d = point(arc, i, j + 1);
          out.push(...a, ...b, ...c, ...a, ...c, ...d);
        }
      }
    }
    return out;
  }
  function portalFrame() {
    const out = [];
    const point = (i, j) => {
      const a = (i * tau) / 96,
        b = (j * tau) / 16;
      const fold = Math.cos(12 * a);
      const center = 0.559 + 0.008 * fold;
      const width = 0.069 + 0.008 * fold;
      const radius = center + width * Math.cos(b);
      const c = Math.cos(a),
        s = Math.sin(a);
      return [
        c * radius, s * radius, 0.5 * Math.sin(b),
        c * Math.cos(b), s * Math.cos(b), 2 * width * Math.sin(b),
      ];
    };
    for (let i = 0; i < 96; i++)
      for (let j = 0; j < 16; j++) {
        const a = point(i, j),
          b = point(i + 1, j),
          c = point(i + 1, j + 1),
          d = point(i, j + 1);
        out.push(...a, ...b, ...c, ...a, ...c, ...d);
      }
    return out;
  }
  function portalVeil() {
    const out = [];
    const point = (a, r) => [Math.cos(a) * r, Math.sin(a) * r, Math.max(0, 1.04 - r) ** 2];
    // Concentric bands model the curved silk, so it has parallax even from the side.
    const bands = [0, 0.22, 0.42, 0.62, 0.82, 1.04, 1.32];
    for (let i = 0; i < 72; i++) {
      const a = (i * tau) / 72;
      const b = ((i + 1) * tau) / 72;
      for (let j = 0; j < bands.length - 1; j++) {
        const r = bands[j],
          next = bands[j + 1];
        if (r) flatTriangle(out, point(a, r), point(a, next), point(b, r));
        flatTriangle(out, point(b, r), point(a, next), point(b, next));
      }
    }
    return out;
  }
  function arch() {
    const out = [];
    const point = (i, j) => {
      const a = (i * Math.PI) / 36,
        b = (j * tau) / 10,
        n = [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)];
      return [
        Math.cos(a) * (0.45 + 0.05 * Math.cos(b)),
        Math.sin(a) * (0.45 + 0.05 * Math.cos(b)),
        0.05 * Math.sin(b),
        ...n,
      ];
    };
    for (let i = 0; i < 36; i++)
      for (let j = 0; j < 10; j++) {
        const a = point(i, j),
          b = point(i + 1, j),
          c = point(i + 1, j + 1),
          d = point(i, j + 1);
        out.push(...a, ...b, ...c, ...a, ...c, ...d);
      }
    return out;
  }
  let fleeceTile;
  function makeFleeceTile() {
    if (fleeceTile) return fleeceTile;
    const tile = document.createElement('canvas');
    tile.width = tile.height = 256;
    const ctx = tile.getContext('2d');
    ctx.fillStyle = '#898989';
    ctx.fillRect(0, 0, 256, 256);
    let seed = 7365;
    const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    ctx.lineCap = 'round';
    for (let i = 0; i < 19500; i++) {
      const x = random() * 256,
        y = random() * 256,
        dx = 1 + random() * 3.3,
        dy = -random() * 4,
        shade = Math.floor(52 + random() * 163);
      ctx.strokeStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
      ctx.lineWidth = 0.65 + random() * 1.25;
      for (const ox of x > 249 ? [0, -256] : [0])
        for (const oy of y < 8 ? [0, 256] : [0]) {
          ctx.beginPath();
          ctx.moveTo(x + ox, y + oy);
          ctx.quadraticCurveTo(x + ox + dx * 0.34, y + oy + dy * 0.8, x + ox + dx, y + oy + dy);
          ctx.stroke();
        }
    }
    fleeceTile = tile;
    return tile;
  }
  // R holds the individual fibres, G the broader nap and B a satin embroidery weave.
  // Canvas is shared between the workshop, portrait previews and the course WebGL context.
  let pileTile;
  function makePileTile() {
    if (pileTile) return pileTile;
    const tile = document.createElement('canvas');
    const size = 256;
    tile.width = tile.height = size;
    const ctx = tile.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#7e7e7e';
    ctx.fillRect(0, 0, size, size);
    ctx.lineCap = 'round';
    let seed = 197955;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    const direction = (x, y) => {
      const u = (tau * x) / size,
        v = (tau * y) / size;
      return (
        0.52 * Math.sin(u * 2 + v + 0.7 * Math.cos(v * 2)) +
        0.31 * Math.cos(u - 3 * v + 0.4 * Math.sin(u * 2)) +
        0.17 * Math.sin(3 * u + 4 * v)
      );
    };
    for (let i = 0; i < 8100; i++) {
      const x = random() * size,
        y = random() * size;
      const angle = 1.41 + direction(x, y) * 1.19 + (random() - 0.5) * 0.75;
      const length = 3 + random() * 9,
        bend = (random() - 0.55) * length * 0.69;
      const dx = Math.cos(angle),
        dy = Math.sin(angle);
      const shade = Math.round(47 + random() * 161);
      const width = 0.8 + random() * 2.1;
      // Wrap both ends so clumps flow across repeated texture boundaries.
      const offsetsX = x < 15 ? [0, size] : x > size - 15 ? [0, -size] : [0];
      const offsetsY = y < 15 ? [0, size] : y > size - 15 ? [0, -size] : [0];
      for (const ox of offsetsX)
        for (const oy of offsetsY) {
          const sx = x + ox,
            sy = y + oy;
          ctx.lineWidth = width;
          ctx.strokeStyle = `rgb(${shade},${shade},${shade})`;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(
            sx + dx * length * 0.48 - dy * bend,
            sy + dy * length * 0.48 + dx * bend,
            sx + dx * length,
            sy + dy * length,
          );
          ctx.stroke();
        }
    }
    const pixels = ctx.getImageData(0, 0, size, size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const offset = (y * size + x) * 4;
        pixels.data[offset + 1] = Math.round(128 + direction(x, y) * 101);
        pixels.data[offset + 2] = Math.round(128 + 115 * Math.cos(((x * 45 + y * 23) * tau) / size));
      }
    ctx.putImageData(pixels, 0, 0);
    pileTile = tile;
    return tile;
  }
  function woodlandScenery(course, add, random) {
    const leaves = ['#478d66', '#5fa16a', '#78ac6d', '#9abc78', '#b2c57c'];
    const soils = ['#517765', '#667a5b', '#758661'];
    const crown = (x, y, z, width, color) =>
      add('ball', [x, y, z], [width, width * 0.53, width * 0.85], color);
    function tree(x, y, z, height, wide, hue) {
      const sway = (random() - 0.5) * 0.24;
      add(
        'ball',
        [x, y + height * 0.39, z],
        [wide * 0.35, height * 1.04, wide * 0.31],
        '#785a48',
        sway,
      );
      for (const side of [-1, 1]) {
        add(
          'ball',
          [x + side * wide * 0.17, y + height * 0.58, z],
          [wide * 0.15, height * 0.47, wide * 0.13],
          -side > 0 ? '#81654b' : '#6c584b',
          -side * 0.62,
        );
        crown(
          x + side * wide * 0.37,
          y + height * 0.78,
          z + side * wide * 0.12,
          wide * 0.68,
          leaves[(hue + (side === 1 ? 1 : 0)) % leaves.length],
        );
      }
      crown(x, y + height, z + wide * 0.1, wide, leaves[(hue + 1) % leaves.length]);
      crown(
        x - wide * 0.19,
        y + height * 0.88,
        z - wide * 0.26,
        wide * 0.71,
        leaves[(hue + 2) % leaves.length],
      );
    }
    function fern(x, y, z, scale) {
      for (const side of [-1, 1]) {
        add(
          'ball',
          [x + side * scale * 0.35, y + scale * 0.58, z],
          [scale * 0.14, scale * 1.33, scale * 0.16],
          '#6fac66',
          -side * 0.54,
        );
        for (let leaf = 0; leaf < 4; leaf++) {
          const f = leaf / 4,
            leafX = x + side * scale * (0.15 + f * 0.55),
            leafY = y + scale * (0.26 + f * 0.78),
            length = scale * (0.82 - f * 0.49);
          add(
            'ball',
            [leafX + side * length * 0.23, leafY + 0.08, z - 0.16],
            [length, length * 0.23, length * 0.31],
            '#a5c574',
            side * 0.39,
          );
          add(
            'ball',
            [leafX - side * length * 0.1, leafY, z + 0.22],
            [length * 0.64, length * 0.2, length * 0.57],
            '#5c9b63',
            -side * 0.36,
          );
        }
      }
    }
    const stands = [[-3.4, -2, 0], ...course.path.filter((_, i) => i % 2 === 0)];
    for (const [i, [padX, z, y]] of stands.entries()) {
      const side = i % 2 ? -1 : 1,
        x = padX + side * (8.2 + random() * 2.2),
        forestFloor = y - 5.3;
      add(
        'ball',
        [x + side * 3.4, forestFloor - 1.7, z + 1],
        [12.5, 5.1, 12.7],
        soils[i % soils.length],
      );
      add('ball', [x + side * 2.6, forestFloor + 0.1, z + 1], [11, 2.3, 11.6], '#8eaf6e');
      tree(
        x + side * 2.2,
        forestFloor,
        z + 0.6,
        9.8 + random() * 2,
        6.4 + random() * 2,
        i % leaves.length,
      );
      tree(x + side * 8, forestFloor - 2, z + 4, 12.8 + random() * 3, 8.1, (i + 2) % leaves.length);
      tree(
        padX - side * (15 + random() * 6),
        forestFloor - 2.8,
        z + 5,
        12 + random() * 4,
        9.3,
        (i + 1) % leaves.length,
      );
      fern(x - side * 1.4, forestFloor + 0.22, z - 1.6, 2.8);
      const mushroomX = x - side * 0.6;
      for (const [dx, scale] of [
        [-0.7, 0.78],
        [0.5, 1.18],
      ]) {
        add(
          'ball',
          [mushroomX + dx, forestFloor + 0.6 * scale, z + 2],
          [0.34 * scale, 1.21 * scale, 0.34 * scale],
          '#f1ddad',
        );
        add(
          'ball',
          [mushroomX + dx, forestFloor + 1.14 * scale, z + 2],
          [1.34 * scale, 0.57 * scale, 1.27 * scale],
          '#d99471',
        );
        add(
          'ball',
          [mushroomX + dx - 0.19, forestFloor + 1.39 * scale, z + 1.9],
          [0.31, 0.11, 0.24],
          '#f3cd97',
        );
      }
      add('cloud', [padX - side * 16, forestFloor - 2.5, z], [17, 3.2, 15], '#e5e9b8');
      for (let mote = 0; mote < 3; mote++) {
        const size = 0.07 + random() * 0.14;
        add(
          'ball',
          [x - side * (1.8 + random() * 2), y + random() * 3, z + random() * 4],
          [size, size, size],
          '#ffe6a0',
        );
      }
    }
  }
  function reefScenery(course, add, random) {
    const coral = [
      ['#bf6478', '#e08b8b', '#ffad94'],
      ['#926ab0', '#b986c0', '#d1a4cf'],
      ['#d68666', '#eba46e', '#ffd196'],
    ];
    const rock = ['#477e91', '#548faa', '#6199a1'];
    function branchingCoral(x, y, z, scale, colors) {
      add(
        'ball',
        [x, y + 0.98 * scale, z],
        [0.62 * scale, 2.55 * scale, 0.61 * scale],
        colors[0],
        -0.1,
      );
      for (const [dx, dz, rise, tilt] of [
        [-0.51, -0.08, 1.62, 0.65],
        [0.58, 0.2, 1.35, -0.66],
        [0.22, -0.43, 1.9, -0.26],
        [-0.13, 0.47, 1.7, 0.24],
      ]) {
        const branchX = x + scale * dx,
          branchZ = z + scale * dz;
        add(
          'ball',
          [branchX, y + scale * rise, branchZ],
          [0.33 * scale, 1.56 * scale, 0.31 * scale],
          colors[1],
          tilt,
        );
        add(
          'ball',
          [branchX - Math.sin(tilt) * scale * 0.54, y + scale * (rise + 0.53), branchZ],
          [0.35 * scale, 0.62 * scale, 0.33 * scale],
          colors[2],
          tilt * 0.57,
        );
      }
    }
    function seaFan(x, y, z, scale, color) {
      for (let pin = -3; pin <= 3; pin++) {
        const angle = pin * 0.29,
          length = (2.15 - 0.17 * Math.abs(pin)) * scale;
        add(
          'ball',
          [x + Math.sin(angle) * length * 0.44, y + Math.cos(angle) * length * 0.48, z + pin * 0.2],
          [scale * 0.24, length, scale * 0.34],
          color,
          -angle,
        );
      }
    }
    function kelp(x, y, z, scale) {
      for (let frond = -1; frond <= 1; frond++) {
        const stemX = x + frond * 0.51 * scale;
        add(
          'ball',
          [stemX, y + scale * 1.5, z + frond * 0.3],
          [0.23 * scale, 3.25 * scale, 0.22 * scale],
          '#238e87',
          frond * -0.29,
        );
        for (let leaf = 0; leaf < 3; leaf++) {
          const side = (frond + leaf) % 2 ? -1 : 1;
          add(
            'ball',
            [
              stemX + side * 0.25 * scale,
              y + (0.95 + leaf * 0.76) * scale,
              z + frond * 0.36 + leaf * 0.21,
            ],
            [scale * 0.35, scale * 1.35, scale * 0.2],
            leaf % 2 ? '#65c3a3' : '#3ba999',
            side * -0.66,
          );
        }
      }
    }
    const beds = [[-5.4, -3, 0], ...course.path.filter((_, i) => i % 3 !== 2)];
    for (const [i, [padX, z, y]] of beds.entries()) {
      const side = i % 2 ? -1 : 1,
        x = padX + side * (8.2 + random() * 1.8),
        sand = y - 4.85;
      add('ball', [x + side * 2.1, sand - 1.5, z], [13.8, 4.4, 12.6], rock[i % rock.length]);
      add('ball', [x, sand - 0.25, z], [7.6, 1.9, 7.4], '#8dccc4');
      branchingCoral(x, sand, z - 0.9, 1.65 + random() * 0.95, coral[i % coral.length]);
      kelp(x + side * 3.1, sand, z + 1.8, 1.25 + random() * 0.62);
      seaFan(x - side * 1.9, sand + 0.24, z + 3.05, 1.3, coral[(i + 1) % coral.length][1]);
      const farX = padX - side * (14.5 + random() * 8);
      add('ball', [farX, sand - 1.1, z + 6], [13.4, 4, 11], '#67aab4');
      branchingCoral(farX, sand, z + 4.4, 2.7 + random(), coral[(i + 2) % coral.length]);
      add('cloud', [farX, sand - 1.7, z + 0.5], [18, 3.4, 12], '#9adbd4');
      for (let bubble = 0; bubble < 4; bubble++) {
        const size = 0.12 + random() * 0.47,
          bubbleX = x + side * 0.9 + (random() - 0.5) * 2.2,
          bubbleY = sand + 4.25 + bubble * (0.65 + random() * 0.32),
          bubbleZ = z + 1.05 + random() * 1.05;
        add('ball', [bubbleX, bubbleY, bubbleZ], [size, size, size], '#9bdddc');
        add(
          'ball',
          [bubbleX - size * 0.13, bubbleY + size * 0.17, bubbleZ - size * 0.39],
          [size * 0.27, size * 0.18, size * 0.15],
          '#eaf7db',
          0.36,
        );
      }
    }
  }
  function appleGrove(add, x, y, z, random) {
    add('ball', [x, y - 0.78, z], [9, 2.8, 8.5], '#c49b7a');
    add('ball', [x, y - 0.08, z], [9.2, 1.65, 8.6], '#aac790');
    const crown = y + 4.9 + random() * 0.9;
    add('cylinder', [x, (crown + y) / 2, z], [crown - y, 0.8, 0.87], '#976c50', Math.PI / 2);
    for (const side of [-1, 1])
      add('ball', [x + side * 0.56, crown - 1.35, z], [0.41, 2.6, 0.55], '#a57d58', -side * 0.53);
    add('ball', [x, crown + 0.9, z + 0.2], [4.7, 3.6, 3.9], '#8aac73');
    for (const side of [-1, 1])
      add('ball', [x + side * 1.42, crown, z], [3.6, 3.1, 3.7], side < 0 ? '#a0bf80' : '#83ac76');
    for (let j = 0; j < 7; j++) {
      const angle = (tau * (j + 0.22)) / 7;
      const ax = x + 2.82 * Math.cos(angle),
        az = z + 1.93 * Math.sin(angle);
      const ay = crown - 1.11 + random() * 1.18,
        size = 0.73 + 0.22 * random();
      add('ball', [ax, ay, az], [size, size * 0.96, size], j % 3 ? '#d85857' : '#f09060');
      add(
        'ball',
        [ax - size * 0.15, ay + size * 0.21, az - size * 0.39],
        [size * 0.13, size * 0.18, size * 0.08],
        '#f3a388',
        -0.27,
      );
      add('ball', [ax + 0.035, ay + size * 0.54, az], [0.08, 0.27, 0.085], '#805942', -0.16);
      add('ear', [ax + 0.15, ay + size * 0.57, az], [0.17, 0.33, 0.12], '#638d60', -1.03);
    }
    for (const side of [-1, 1])
      add('ball', [x + 0.48 * side, y + 0.56, z + 0.2], [0.4, 1.6, 0.58], '#986e53', -side * 0.94);
    for (let i = 0; i < 3; i++) {
      const bx = x - 2.3 + i * 1.7,
        bz = z - 1.85 - 0.46 * (i % 2);
      for (let j = 0; j < 5; j++) {
        const a = (tau * j) / 5;
        add(
          'ball',
          [bx + 0.24 * Math.cos(a), y + 0.64, bz + 0.24 * Math.sin(a)],
          [0.38, 0.14, 0.38],
          '#f7d3cf',
        );
      }
      add('ball', [bx, y + 0.71, bz], [0.19, 0.12, 0.19], '#efd08d');
    }
  }
  function iceRidge(add, x, y, z, random) {
    add('ball', [x, y - 0.9, z], [10.2, 3.6, 8.5], '#7d9abe');
    add('ball', [x, y - 0.12, z], [10.5, 2.25, 8.7], '#d1e6ef');
    for (const [dx, dz, height, width, lean, color] of [
      [0, 0, 6.5, 2.1, 0.04, '#a3dbe4'],
      [-1.2, 0.25, 4, 1.4, 0.28, '#a6b9e2'],
      [1.15, -0.24, 3.3, 1.28, -0.34, '#a5dcce'],
      [0.36, 1.0, 4, 1.65, -0.12, '#c6bde7'],
    ]) {
      add(
        'ice-spire',
        [x + dx, y + 0.65, z + dz],
        [width, height * (0.82 + random() * 0.38), width],
        color,
        lean,
        -19,
      );
    }
  }
  function scenery(course) {
    const objects = [];
    let seed = course.id.length * 487 + 73;
    const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const add = (mesh, p, s, c, rot = 0, mat = 0) => objects.push({ mesh, p, s, c, rot, mat });
    if (window.FluffFlowerScenery.build(course, add, random)) return objects;
    if (course.id === 'orchard' || course.id === 'frost') {
      const addIsland = course.id === 'orchard' ? appleGrove : iceRidge;
      for (let i = 0; i < course.path.length; i += 2) {
        const [lane, z, y] = course.path[i];
        const side = i % 4 ? -1 : 1;
        const x = lane + side * (11.5 + random() * 2.7);
        addIsland(add, x, y - 2.5, z + 5, random);
        add('cloud', [x - side * 24, y - 5, z + 4], [19, 3.8, 14], course.fog);
      }
      return objects;
    }
    if (course.id === 'grove') {
      woodlandScenery(course, add, random);
      return objects;
    }
    if (course.id === 'reef') {
      reefScenery(course, add, random);
      return objects;
    }
    const end = course.path.at(-1)[1],
      night = course.id === 'night',
      candy = course.id === 'candy';
    const clouds = night
      ? ['#c4b9ec', '#dec9ec', '#b5c9ed']
      : candy
        ? ['#ffe2e8', '#fff0df', '#f5d5ef']
        : ['#fff5e4', '#f4e7fb', '#deefff'];
    for (let z = -12, i = 0; z < end + 25; z += 13, i++) {
      const side = i % 2 ? 1 : -1;
      add(
        'cloud',
        [side * (5 + random() * 20), -8 - random() * 3, z + random() * 5],
        [13 + random() * 13, 3.5 + random() * 3.5, 8 + random() * 8],
        clouds[i % clouds.length],
      );
      if (i % 3 !== 1) {
        add(
          'cloud',
          [-side * (20 + random() * 12), -5 - random() * 2, z + 4 + random() * 6],
          [10 + random() * 8, 3.1 + random() * 2.6, 5 + random() * 6],
          clouds[(i + 1) % clouds.length],
        );
      }
    }
    for (let z = 7, i = 0; z < end + 34; z += 24, i++) {
      const side = i % 2 ? -1 : 1;
      add(
        'cloud',
        [side * (16 + random() * 15), 3 + random() * 6, z + random() * 10],
        [6 + random() * 6, 3.2 + random() * 4, 4 + random() * 6],
        clouds[(i + 2) % clouds.length],
      );
    }
    if (night) {
      for (let i = 0; i < 85; i++) {
        const u = random(),
          sz = 0.15 + random() * 0.75;
        add(
          'star',
          [(random() - 0.5) * 108, 4 + u * 22, random() * (end + 95) - 32],
          [sz, sz, sz * 0.65],
          '#ffe29a',
          (random() - 0.5) * 0.6,
        );
      }
      add('ball', [13, 9, 35], [5.8, 5.8, 1.2], '#ffe7a2');
      for (let i = 0; i < 3; i++)
        add(
          'ball',
          [12.25 + i * 0.65, 8.3 + Math.sin(i * 2) * 0.95, 34.46],
          [0.63, 0.59, 0.09],
          '#efcc8e',
        );
    } else if (candy) {
      for (let i = 0; i < Math.ceil(end / 7) + 1; i++) {
        const side = i % 2 ? 1 : -1,
          x = side * (7.5 + random() * 5),
          z = i * 7,
          y = -1 + random() * 0.7;
        add('ball', [x, y, z], [2.6, 3.1, 2.6], '#f58291', 0.14 * side);
        for (let j = 0; j < 4; j++)
          add(
            'ball',
            [x + Math.cos(j * 1.6) * 0.45, y + 1.42, z + Math.sin(j * 1.6) * 0.4],
            [1.1, 0.23, 0.6],
            '#91bc85',
            j * 0.3,
          );
        for (let j = 0; j < 5; j++)
          add(
            'ball',
            [x + Math.sin(j * 2) * 0.75, y - 0.4 + j * 0.24, z - 1.02],
            [0.11, 0.2, 0.1],
            '#ffe2ac',
            0.15,
          );
        add('box', [-x * 0.95, 0.2, z + 3], [0.45, 4, 0.46], '#f28baa', side * 0.16, 2);
        add('ball', [-x * 0.95 + side * 0.3, 2.32, z + 3], [1.9, 1.9, 0.55], '#f5abc3', 0.25, 2);
      }
    } else {
      for (const [x, y, z, s] of [
        [9, -1, 12, 7.2],
        [-10, -1.3, end * 0.52, 7.4],
        [10, -2, end - 5, 9],
      ]) {
        ['#e7a7c3', '#f9c4a5', '#f7e4ac', '#acd8be', '#b8bce4'].forEach((c, i) =>
          add('arch', [x, y, z], [s - i * 0.53, s - i * 0.53, 4], c),
        );
      }
      for (let i = 0; i < Math.ceil(end / 13); i++) {
        const x = (i % 2 ? -1 : 1) * (6.8 + random() * 4),
          y = -2.5,
          z = 3 + i * 13;
        add('ball', [x, y, z], [3.7, 1.7, 3.5], '#b2d7a3');
        for (let j = 0; j < 6; j++) {
          const a = (j * tau) / 6;
          add(
            'ball',
            [x + Math.cos(a) * 0.51, y + 1.54 + Math.sin(a) * 0.43, z - 0.1],
            [0.57, 0.64, 0.26],
            '#fff1d2',
            -a,
          );
        }
        add('ball', [x, y + 1.54, z - 0.25], [0.48, 0.48, 0.33], '#f6cc74');
      }
    }
    return objects;
  }
  function cameraBoxEntry(anchor, forward, distance, low, high) {
    let enter = 0,
      exit = distance;
    for (let axis = 0; axis < 3; axis++) {
      const dir = -forward[axis],
        origin = anchor[axis];
      if (Math.abs(dir) < 0.00001) {
        if (origin < low[axis] || origin > high[axis]) return Infinity;
        continue;
      }
      const a = (low[axis] - origin) / dir,
        b = (high[axis] - origin) / dir;
      enter = Math.max(enter, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
    }
    return enter <= exit ? enter : Infinity;
  }
  // Shorten the camera arm if a cushion or padded wall would sit in front of the lens.
  function followDistance(anchor, forward, pads, hazards, time) {
    let distance = 4.45;
    for (const p of pads) {
      if (p.gone) continue;
      if (Math.abs(anchor[2] - p.z) > distance + p.d / 2) continue;
      if (p.kind === 'slide' || p.kind === 'stairs') {
        for (let arm = 0.48; arm < distance; arm += 0.16) {
          const x = anchor[0] - arm * forward[0],
            z = anchor[2] - arm * forward[2];
          if (
            Math.abs(z - p.z) > p.d / 2 ||
            Math.abs(x - window.FluffSkyRides.laneCenter(p, z)) > p.w / 2
          )
            continue;
          if (p.kind === 'stairs' && window.FluffSkyRides.dropped(p, z, time)) continue;
          if (anchor[1] - arm * forward[1] <= padHeight(p, x, z) + 0.18) {
            distance = Math.max(0.48, arm - 0.18);
            break;
          }
        }
        continue;
      }
      const rise = (Math.abs(p.slopeX || 0) * p.w + Math.abs(p.slopeZ || 0) * p.d) / 2;
      if (anchor[1] - Math.max(0, forward[1]) * distance > p.y + rise + 0.16) continue;
      const low = [p.x - p.w / 2 - 0.13, p.y - rise - 0.97, p.z - p.d / 2 - 0.13];
      const high = [p.x + p.w / 2 + 0.13, p.y + rise + 0.13, p.z + p.d / 2 + 0.13];
      const entry = cameraBoxEntry(anchor, forward, distance, low, high);
      distance = Math.min(distance, Math.max(0.48, entry - 0.09));
    }
    for (const h of hazards) {
      if (h.type !== 'zipperGate' && h.type !== 'pillowPress') continue;
      const halfDepth = h.depth / 2 + 0.13;
      if (Math.abs(anchor[2] - h.z) > halfDepth + distance) continue;
      const halfWidth = h.width / 2 + 0.10;
      const low = [h.x - halfWidth, h.minY - 0.08, h.z - halfDepth];
      const high = [h.x + halfWidth, h.maxY + 0.08, h.z + halfDepth];
      const entry = cameraBoxEntry(anchor, forward, distance, low, high);
      // Keep the near plane clear even when the wall has just moved across the opening.
      distance = Math.min(distance, Math.max(0.24, entry - 0.08));
    }
    return distance;
  }
  function towerCameraDistance(anchor, forward, distance, tower) {
    const [x, y, z] = anchor;
    const dz = z - tower.z;
    const a = forward[0] ** 2 + forward[2] ** 2;
    const toward = x * forward[0] + dz * forward[2];
    const radius = tower.radius + 0.16;
    const discriminant = toward ** 2 - a * (x * x + dz * dz - radius ** 2);
    if (discriminant <= 0) return distance;
    const entry = (toward - Math.sqrt(discriminant)) / a;
    if (entry < 0 || entry > distance || y - forward[1] * entry >= tower.roof) return distance;
    return Math.max(0.34, entry - 0.09);
  }
  let sharedMeshes;
  function meshTemplates() {
    if (!sharedMeshes) {
      const templates = {
        egg: plushMesh(0.32),
        ear: plushMesh(1.65),
        ...sewnEarMeshes(),
        ...hedgehogMeshes(quillMesh()),
        box: roundedBox(),
        ball: sphere(),
        'aurora-sky': [-1, -1, 0, 0, 0, 1, 3, -1, 0, 0, 0, 1, -1, 3, 0, 0, 0, 1],
        'ice-spire': iceSpire(),
        cushion: sphere(64, 24),
        'knit-cuff': window.FluffOutfits.cuffMesh(),
        cylinder: cylinder(),
        star: star(),
        'pickup-ring': pickupRing(),
        'portal-frame': portalFrame(),
        'portal-veil': portalVeil(),
        badge: badgeMesh(),
        ...window.FluffFairground.confettiMeshes(),
        ...window.FluffGust.meshes(),
        slide: window.FluffSkyRides.slideMesh(),
        arch: arch(),
        ...window.FluffSkyBalloons.meshes(),
        ...Object.fromEntries(
          [...window.FluffPadStyles.shapes, 'rectangle'].map((shape) => [
            `pad-${shape}`,
            window.FluffPadStyles.mesh(shape),
          ]),
        ),
      };
      sharedMeshes = Object.entries(templates).map(([name, vertices]) => [
        name,
        new Float32Array(vertices),
      ]);
    }
    return sharedMeshes;
  }
  class World {
    constructor(canvas, { tryThree = false } = {}) {
      this.canvas = canvas;
      const options = {
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      };
      const compareRaw = new URLSearchParams(window.location.search).get('renderer') === 'webgl';
      const gl2 = tryThree && !compareRaw && window.FluffThree && canvas.getContext('webgl2', options);
      const gl = gl2 || canvas.getContext('webgl', options);
      if (!gl)
        throw new Error(
          '3D-näkymä tarvitsee WebGL-tuen. Avaa peli tämän koneen Chromessa, Firefoxissa tai Safarissa ja ota grafiikkakiihdytys käyttöön.',
        );
      this.gl = gl;
      const shader = (type, source) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
        return s;
      };
      const program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error('3D-näkymän käynnistys epäonnistui.');
      this.program = program;
      gl.useProgram(program);
      this.u = {};
      for (const name of [
        'loc',
        'size',
        'camera',
        'rightDir',
        'upDir',
        'forwardDir',
        'lens',
        'spin',
        'color',
        'fog',
        'material',
        'garment',
        'scarfSwing',
        'wingPose',
        'clothTint',
        'modelBasis',
        'modelBase',
        'padPlane',
        'pileLength',
        'studioFeet',
        'sceneTime',
        'portalMotion',
        'portalAccent',
      ])
        this.u[name] = gl.getUniformLocation(program, name);
      gl.uniformMatrix3fv(this.u.modelBasis, false, identity);
      this.pos = gl.getAttribLocation(program, 'position');
      this.normal = gl.getAttribLocation(program, 'normal');
      gl.enableVertexAttribArray(this.pos);
      gl.enableVertexAttribArray(this.normal);
      this.meshes = {};
      this.uploadMeshes(meshTemplates());
      const tiles = {
        fleece: makeFleeceTile(), shortPile: makePileTile(), knitLoops: window.FluffOutfits.knitTile(),
      };
      this.textures = [];
      for (const [unit, sampler] of [
        [0, 'fleece'],
        [2, 'shortPile'],
        [3, 'knitLoops'],
      ]) {
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tiles[sampler]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.uniform1i(gl.getUniformLocation(program, sampler), unit);
        this.textures.push([unit, texture]);
      }
      if (gl2) this.batches = new window.FluffThreeBatches(canvas, gl, fragment, tiles);
      this.restoreRawState();
      this.colors = new Map();
      this.padPlane = flatPlane;
      this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    }
    uploadMeshes(templates) {
      const gl = this.gl;
      for (const [name, vertices] of templates) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        this.meshes[name] = { buffer, count: vertices.length / 6, vertices };
      }
    }
    restoreRawState() {
      // Three.js renders to the same color and depth buffers. Rebind the custom passes' resources.
      const gl = this.gl;
      gl.bindVertexArray?.(null);
      gl.useProgram(this.program);
      gl.enableVertexAttribArray(this.pos);
      gl.enableVertexAttribArray(this.normal);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.depthFunc(gl.LESS);
      gl.clearColor(0, 0, 0, 0);
      for (const [unit, texture] of this.textures) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
      }
      gl.activeTexture(gl.TEXTURE0);
      this.lastMesh = null;
    }
    setup(course) {
      this.course = course;
      this.destination = window.FluffCourses.nextCourse(course);
      if (course.tower && !this.towerMeshesLoaded) {
        const descent = window.FluffSkyRides.slideMesh(course.tower.descent);
        this.uploadMeshes([
          ...Object.entries(window.FluffTowerScenery.meshes()),
          ['tower-slide', new Float32Array(descent)],
        ]);
        this.towerMeshesLoaded = true;
      }
      this.cloudRenderer ??= new window.FluffClouds(this.gl);
      this.clouds = [];
      this.colors.set(course.fog, rgb(course.fog));
      const shade = {
        night: '#776d94',
        cloud: '#a5b7cd',
        candy: '#c4a3b5',
        grove: '#7b9d82',
        reef: '#56a7b2',
        orchard: '#c2ae98',
        frost: '#6988ae',
        rose: '#d294aa',
        meadow: '#84aa8c',
        lagoon: '#7aa9c9',
        tulip: '#a28fbb',
        tower: '#a98dbb',
        endless: '#b59fae',
      };
      this.cloudShade = rgb(shade[course.id]);
      this.props = course.endless ? [] : scenery(course);
      this.skyRoutes = course.endless ? null : window.FluffSkyBalloons.fixedRoutes(course);
      this.skySectors = new Map();
      this.cameraY = null;
      this.lastCameraTime = null;
      const sky = 'linear-gradient(' + course.sky.join(',') + ')';
      const sunbeams =
        'repeating-conic-gradient(from 103deg at 71% -40%, transparent 0 9deg, #eefbe522 12deg, transparent 17deg 31deg)';
      this.canvas.parentElement.style.background = course.id === 'reef' ? sunbeams + ', ' + sky : sky;
    }
    draw(mesh, p, s, c, rot = 0, mat = 0) {
      const gl = this.gl,
        u = this.u,
        m = typeof mesh === 'string' ? this.meshes[mesh] : mesh;
      if (m !== this.lastMesh) {
        gl.bindBuffer(gl.ARRAY_BUFFER, m.buffer);
        gl.vertexAttribPointer(this.pos, 3, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 24, 12);
        this.lastMesh = m;
      }
      if (!this.colors.has(c)) this.colors.set(c, rgb(c));
      gl.uniform3fv(u.loc, p);
      gl.uniform3fv(u.size, s);
      gl.uniform3fv(u.color, this.colors.get(c));
      gl.uniform1f(u.spin, rot);
      gl.uniform1f(u.material, mat);
      gl.drawArrays(gl.TRIANGLES, 0, m.count);
      // A sparse second surface gives the torso a short, irregular fleece silhouette.
      if (mesh === 'egg' && (mat === 3 || mat === 3.25)) {
        gl.uniform1f(u.pileLength, 0.0065);
        gl.drawArrays(gl.TRIANGLES, 0, m.count);
        gl.uniform1f(u.pileLength, 0);
      }
    }
    drawOpaque(mesh, p, s, color, rot = 0, mat = 0) {
      if (this.batches) {
        if (!this.colors.has(color)) this.colors.set(color, rgb(color));
        this.batches.add(mesh, this.meshes[mesh].vertices, p, s, this.colors.get(color), rot, mat, this.padPlane);
      } else this.draw(mesh, p, s, color, rot, mat);
    }
    drawDetail(vertices, p, color, material, size = unitSize) {
      const gl = this.gl;
      const meshes = (this.detailMeshes ??= new Map());
      let mesh = meshes.get(vertices);
      if (!mesh) {
        if (meshes.size >= 192) {
          const oldest = meshes.keys().next().value;
          gl.deleteBuffer(meshes.get(oldest).buffer);
          meshes.delete(oldest);
        }
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        mesh = { buffer, count: vertices.length / 6 };
        meshes.set(vertices, mesh);
      }
      this.draw(mesh, p, size, color, 0, material);
    }
    drawPortal(gate, state) {
      const { x, y, z, radiusX, radiusY } = gate;
      const { gl, u, destination } = this;
      const distance = Math.hypot(state.x - x, state.y + 0.65 - y, state.z - z);
      const near = clamp(1 - (distance - 0.75) / 7, 0, 1);
      const wake = near * near * (3 - 2 * near);
      const reduced = this.reducedMotion?.matches;
      const time = reduced ? 0 : state.time;
      gl.uniform2f(u.portalMotion, time, wake);
      gl.uniform3fv(u.portalAccent, rgb(destination.sky[1]));
      this.draw('portal-frame', [x, y, z], [2 * radiusX, 2 * radiusY, 0.54], destination.side, 0, -21);
      for (const side of [-1, 1])
        this.draw('star', [x, y + 1.20 * radiusY, z + side * 0.22], [0.39, 0.39, 0.31], '#ffe7a8');
      if (distance > 26) return;
      // Little knots follow the outward curves on both faces of the opening.
      const count = reduced ? 4 : 10;
      for (let i = 0; i < count; i++) {
        const seed = i * 2.39996;
        const a = seed + time * (i % 2 ? -0.24 : 0.34);
        const r = 1.10 + 0.17 * Math.cos(seed * 3 + time * 0.79);
        const rise = y + r * radiusY * Math.sin(a);
        if (rise < y - radiusY * 0.75) continue;
        const depth = 0.57 * Math.sin(seed * 2 + time * 0.66);
        const shimmer = (0.52 + 0.48 * wake) * (0.76 + 0.24 * Math.cos(seed + time * 1.8));
        const size = (i % 3 ? 0.11 : 0.18) * shimmer;
        this.draw(
          i % 3 ? 'ball' : 'star',
          [x + r * radiusX * Math.cos(a), rise, z + depth],
          [size, size, size],
          i % 2 ? destination.sky[2] : '#fff0c4',
          a * 0.5,
        );
      }
    }
    drawPortalSilk({ x, y, z, radiusX, radiusY }) {
      const { gl, destination } = this;
      // Draw back to front from either side, testing the course and plush depth but writing none.
      const side = this.view.camera[2] < z ? 1 : -1;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      this.draw('portal-veil', [x, y, z + side * 0.39], [radiusX, radiusY, side * 0.64], destination.sky[0], 0, -17);
      this.draw('portal-veil', [x, y, z - side * 0.25], [radiusX * 1.1, radiusY * 1.1, 1], destination.side, 0, -22);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    setPadPlane(pad) {
      const x = pad?.slopeX || 0,
        z = pad?.slopeZ || 0;
      // Apply the same height at every horizontal point, without shortening the board.
      this.padPlane = x || z ? [x, z, -x * pad.x - z * pad.z] : flatPlane;
      this.gl.uniform3fv(this.u.padPlane, this.padPlane);
    }
    drawPadShadow(pad, x, z, size, color) {
      if (pad.kind === 'stairs' || pad.kind === 'slide') {
        if (pad.kind === 'slide') {
          const slopeX = (padHeight(pad, x + 0.02, z) - padHeight(pad, x - 0.02, z)) / 0.04;
          const slopeZ = (padHeight(pad, x, z + 0.02) - padHeight(pad, x, z - 0.02)) / 0.04;
          this.setPadPlane({ x, z, slopeX, slopeZ });
        }
        this.draw('ball', [x, padHeight(pad, x, z) + 0.018, z], size, color);
        this.setPadPlane(null);
        return;
      }
      this.setPadPlane(pad);
      this.draw('ball', [x, pad.y + 0.012, z], size, color);
      this.setPadPlane(null);
    }
    drawSweeper(h, pad) {
      const { gl, u } = this;
      const diameter = h.r * 2;
      const floor = padHeight(pad, h.x, h.z);
      const hub = h.y - floor;
      const c = Math.cos(h.angle),
        s = Math.sin(h.angle);
      this.draw('ball', [h.x, floor + 0.056, h.z], [diameter * 1.75, 0.16, diameter * 1.75], '#8f719a');
      this.draw('box', [h.x, floor + hub * 0.5, h.z], [diameter, hub + 0.05, diameter], '#a67fb2');
      gl.uniform3fv(u.modelBase, [h.x, h.y, h.z]);
      gl.uniformMatrix3fv(u.modelBasis, false, [c, 0, s, 0, 1, 0, -s, 0, c]);
      this.draw('cylinder', [0, 0, 0], [h.halfSpan * 2, diameter, diameter], '#b15982', 0, 6);
      for (const side of [-1, 1])
        this.draw('ball', [side * h.halfSpan, 0, 0], [diameter, diameter, diameter], '#ee9f9e');
      this.draw('ball', [0, 0, 0], [diameter * 1.44, diameter * 1.25, diameter * 1.44], '#9d6197');
      this.draw(
        'ball',
        [0, diameter * 0.58, 0],
        [diameter * 0.44, diameter * 0.22, diameter * 0.44],
        '#f7cf95',
      );
      gl.uniform3fv(u.modelBase, [0, 0, 0]);
      gl.uniformMatrix3fv(u.modelBasis, false, identity);
    }
    drawSwingRopes(h, pad) {
      const gl = this.gl,
        u = this.u;
      for (const side of [-1, 1]) {
        const x = h.x + side * (h.halfSpan + 0.4);
        this.draw('box', [x, (pad.y + h.pivotY) / 2, pad.z], [0.16, h.pivotY - pad.y, 0.26], '#af84aa');
        this.draw('box', [x - side * 0.2, h.pivotY, pad.z], [0.55, 0.14, 0.22], '#edbbbd');
      }
      // The axle and its two ribbons swing together around the X axis.
      const c = Math.cos(h.angle),
        s = Math.sin(h.angle);
      gl.uniform3fv(u.modelBase, [h.x, h.pivotY, pad.z]);
      gl.uniformMatrix3fv(u.modelBasis, false, [1, 0, 0, 0, c, -s, 0, s, c]);
      for (const side of [-1, 1]) {
        this.draw('ball', [side * h.halfSpan, 0, 0], [0.2, 0.22, 0.22], '#e0b68c');
        this.draw('box', [side * h.halfSpan, -h.rope / 2, 0], [0.08, h.rope, 0.07], '#98738a');
      }
      gl.uniform3fv(u.modelBase, [0, 0, 0]);
      gl.uniformMatrix3fv(u.modelBasis, false, identity);
    }
    drawScenery(objects, offsetZ, camera, yaw, aspect) {
      const cy = Math.cos(yaw),
        sy = Math.sin(yaw);
      for (const o of objects) {
        const z = o.p[2] + offsetZ,
          dx = o.p[0] - camera[0],
          dz = z - camera[2],
          depth = dx * sy + dz * cy;
        if (
          depth < -6 ||
          depth > 89 ||
          Math.abs(dx * cy - dz * sy) > (Math.max(0, depth) + 12) * (aspect + 1)
        )
          continue;
        if (o.mesh === 'cloud') {
          if (!this.colors.has(o.c)) this.colors.set(o.c, rgb(o.c));
          this.clouds.push({
            p: [o.p[0], o.p[1], z],
            s: o.s,
            color: this.colors.get(o.c),
            variant: Math.abs(Math.floor(o.p[0] * 3 + o.p[2])) % 4,
            depth,
          });
        } else this.drawOpaque(o.mesh, [o.p[0], o.p[1], z], o.s, o.c, o.rot, o.mat);
      }
    }
    drawSky(camera, yaw, aspect, time) {
      const course = this.course;
      if (!course.endless) {
        this.drawScenery(this.props, 0, camera, yaw, aspect);
        const { balloons, path } = this.skyRoutes;
        window.FluffSkyBalloons.draw(this, balloons, 0, time, this.view, path);
        return;
      }
      const sector = Math.floor((course.originZ + camera[2]) / 40);
      for (const key of this.skySectors.keys())
        if (Math.abs(key - sector) > 3) this.skySectors.delete(key);
      for (let key = sector - 3; key <= sector + 3; key++) {
        if (!this.skySectors.has(key))
          this.skySectors.set(key, window.FluffSkySector(course.seed, key));
        const { props, balloons } = this.skySectors.get(key);
        const offsetZ = key * 40 - course.originZ;
        this.drawScenery(props, offsetZ, camera, yaw, aspect);
        window.FluffSkyBalloons.draw(this, balloons, offsetZ, time, this.view);
      }
    }
    drawGifts(state, pads) {
      const { course } = this;
      for (const box of course.gifts ?? []) {
        const pad = pads[box.at - (course.firstIndex || 0)];
        if (!pad || Math.abs(pad.z - state.z) > 45) continue;
        const position = window.FluffCourses.giftPosition(box, pad, state.time);
        this.drawPadShadow(pad, position.x, position.z, [0.86, 0.014, 0.66], '#bf91a7');
        window.FluffFairground.drawGift(this, position, state.time, null);
      }
      if (state.lastGift) {
        const gift = state.lastGift;
        const age = state.time - gift.time;
        if (age < 0 || age >= 0.8) return;
        let boxScale = 1;
        if (!this.thirdPerson) {
          // The opening lid otherwise sweeps through the camera as the player runs over the gift.
          const [cx, cy, cz] = this.view.camera;
          const dy = cy - clamp(cy, gift.y - 0.45, gift.y + 1.25);
          const distance = Math.hypot(cx - gift.x, dy, cz - gift.z);
          boxScale = clamp((distance - 0.55) / 0.85, 0, 1);
        }
        if (boxScale > 0.01)
          window.FluffFairground.drawGift(
            this,
            gift,
            state.time,
            age,
            this.reducedMotion?.matches,
            boxScale,
          );
      }
    }
    drawStars(state, pads) {
      const { course, gl, u } = this;
      for (const token of course.stars ?? []) {
        const pad = pads[token.at - (course.firstIndex || 0)];
        if (!pad || pad.gone || Math.abs(pad.z - state.z) > 64) continue;
        const { x, y, z } = window.FluffEndless.starPosition(token, pad, state.time);
        const t = state.time * 1.8 + token.at;
        this.drawPadShadow(pad, x, z, [0.49, 0.014, 0.27], '#488d89');
        const yaw = state.yaw + 0.42 * Math.sin(t),
          c = Math.cos(yaw),
          s = Math.sin(yaw);
        gl.uniform3fv(u.modelBase, [x, y, z]);
        gl.uniformMatrix3fv(u.modelBasis, false, [c, 0, -s, 0, 1, 0, s, 0, c]);
        this.draw('badge', [0, 0, 0], [0.74, 0.74, 0.19], '#078e84', 0.12 * Math.sin(t), 7);
        gl.uniform3fv(u.modelBase, [0, 0, 0]);
        gl.uniformMatrix3fv(u.modelBasis, false, identity);
      }
    }
    drawPickupBursts(state) {
      const { lastStar, lastGift, time } = state;
      const reduced = this.reducedMotion?.matches;
      const starDuration = reduced ? 0.27 : 0.42;
      const starAge = lastStar ? time - lastStar.time : -1;
      const giftAge = lastGift ? time - lastGift.time : -1;
      const fairground = window.FluffFairground;
      const spark = starAge >= 0 && starAge < starDuration;
      const confetti = fairground.confettiActive(giftAge, reduced);
      if (!spark && !confetti) return;
      // At close range the pad can otherwise hide the entire burst.
      if (!this.thirdPerson) this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
      if (spark) this.drawStarBurst(this.pickupEffectOrigin(lastStar), starAge, starDuration, reduced);
      if (confetti) fairground.drawConfetti(this, this.pickupEffectOrigin(lastGift), giftAge, reduced);
    }
    drawStarBurst({ x, y, z }, age, duration, reduced) {
      const { gl, u } = this;
      const { right, up, forward } = this.view;
      gl.uniform3fv(u.modelBase, [x, y, z]);
      gl.uniformMatrix3fv(u.modelBasis, false, [...right, ...up, ...forward]);
      if (age < 0.2) {
        const t = age / 0.2;
        const ring = 0.35 + (reduced ? 0.39 : 1.13) * (1 - (1 - t) ** 2);
        this.draw('pickup-ring', flatPlane, [ring, ring, 0.65], '#91eed4', 0.16);
      }
      if (age < 0.13) {
        const glow = (reduced ? 0.19 : 0.35) * (1 - age / 0.13);
        this.draw('star', flatPlane, [glow, glow, 0.14], '#fff4c2', 0.2);
      }
      const count = reduced ? 5 : 12;
      const t = age / duration;
      const reach = reduced ? 0.56 : 1;
      for (let i = 0; i < count; i++) {
        const angle = (i * tau) / count + 0.27 + 0.13 * Math.sin(i * 2);
        const radius = 0.17 + reach * (0.66 + 0.16 * Math.sin(i * 17)) * (1 - (1 - t) ** 3);
        const puff = i % 3 === 0;
        const size = (puff ? 0.2 : 0.24) * (1 - t) ** 0.85 * (reduced ? 0.77 : 1);
        this.draw(
          puff ? 'star' : 'ball',
          [
            Math.cos(angle) * radius,
            Math.sin(angle) * radius * 0.84 + reach * age * 0.33,
            Math.cos(angle * 3) * radius * 0.19,
          ],
          [size, size * (puff ? 1 : 0.3), size * 0.44],
          ['#fff2b3', '#38c4ab', '#9bf0df'][i % 3],
          angle + (puff && !reduced ? age * 4 : 0),
        );
      }
      gl.uniform3fv(u.modelBase, flatPlane);
      gl.uniformMatrix3fv(u.modelBasis, false, identity);
    }
    character(state) {
      const { gl, u } = this;
      const pose = window.FluffPlush.motion(state);
      const angle = state.heading + Math.PI + pose.spin;
      const scale = 0.77,
        width = scale / Math.sqrt(pose.height),
        height = scale * pose.height;
      const c = Math.cos(angle),
        s = Math.sin(angle),
        r = Math.sin(pose.roll),
        v = Math.cos(pose.roll);
      const lean = pose.tilt - (state.sliding ? 0.18 : 0);
      const t = Math.sin(lean),
        q = Math.cos(lean);
      const bob = Math.abs(pose.stride) * 0.064;
      gl.uniform3fv(u.modelBase, [state.x, state.y - 0.048 + bob, state.z]);
      // Yaw, then a small roll and forward lean; stretch around the grounded feet.
      gl.uniformMatrix3fv(u.modelBasis, false, [
        (c * v + s * t * r) * width,
        q * r * width,
        (-s * v + c * t * r) * width,
        (-c * r + s * t * v) * height,
        q * v * height,
        (s * r + c * t * v) * height,
        s * q * width,
        -t * width,
        c * q * width,
      ]);
      window.FluffPlush.model(this, this.look, state, pose);
      gl.uniformMatrix3fv(u.modelBasis, false, identity);
      gl.uniform3fv(u.modelBase, [0, 0, 0]);
    }
    pickupEffectOrigin(pickup) {
      if (this.thirdPerson || !this.view) return pickup;
      const { camera, forward, right, up, width, height, focalX, focalY } = this.view;
      // At contact the pickup often passes under the first-person camera. Keep its
      // burst on the side it came from, just above the player's paws, as they run on.
      this.pickupBearings ??= new WeakMap();
      let bearing = this.pickupBearings.get(pickup);
      if (!bearing) {
        const screen = this.project([pickup.x, pickup.y, pickup.z]);
        const side = (pickup.x - camera[0]) * right[0] + (pickup.z - camera[2]) * right[2];
        bearing = [
          clamp(screen ? (2 * screen.x) / width - 1 : side, -0.52, 0.52),
          clamp(screen ? 1 - (2 * screen.y) / height : -0.5, -0.56, 0.4),
        ];
        this.pickupBearings.set(pickup, bearing);
      }
      const depth = 3.2;
      const dx = (bearing[0] * width * depth) / (2 * focalX);
      const dy = (bearing[1] * height * depth) / (2 * focalY);
      const [x, y, z] = camera.map((v, i) => v + depth * forward[i] + dx * right[i] + dy * up[i]);
      return { x, y, z };
    }
    project(point) {
      if (!this.view) return null;
      const { camera, right, up, forward, width, height, focalX, focalY } = this.view;
      const dx = point[0] - camera[0],
        dy = point[1] - camera[1],
        dz = point[2] - camera[2];
      const along = (axis) => dx * axis[0] + dy * axis[1] + dz * axis[2];
      const depth = along(forward);
      if (depth <= 0.06) return null;
      return {
        x: width / 2 + (focalX * along(right)) / depth,
        y: height / 2 - (focalY * along(up)) / depth,
        scale: focalY / depth,
      };
    }
    render(state, pads, hazards, focus = null) {
      const { canvas, gl, u, course } = this;
      const ratio = Math.min(1.6, window.devicePixelRatio || 1),
        w = Math.round(canvas.clientWidth * ratio),
        h = Math.round(canvas.clientHeight * ratio);
      if (canvas.width !== w || canvas.height !== h) {
        if (this.batches) this.batches.resize(w, h);
        else {
          canvas.width = w;
          canvas.height = h;
        }
        gl.viewport(0, 0, w, h);
      }
      this.batches?.begin();
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const { x, y, z, time } = state;
      const width = canvas.clientWidth,
        height = canvas.clientHeight;
      // Keep the neighbouring landing pads in view on a tall phone display.
      const lensY = focus ? lens : clamp(2.12 * width / height, 0.96, lens),
        lensX = lensY * h / w,
        focalY = lensY * height / 2,
        focalX = lensX * width / 2;
      const across = focus ? (focus.x - width / 2) / focalX : 0;
      const above = focus ? (height / 2 - focus.y) / focalY : 0;
      // Aim off-centre by turning the camera, keeping the eye in front of the
      // resident and above the porch even when the keyboard takes up half the screen.
      const pitch = focus
        ? -0.14 - Math.atan(above)
        : this.thirdPerson
          ? clamp(state.pitch - 0.17, -0.79, course.tower ? 0.46 : -0.12)
          : state.pitch;
      const yaw = focus
        ? focus.speaker.yaw - Math.atan2(across, Math.cos(pitch) - above * Math.sin(pitch))
        : state.yaw;
      const cy = Math.cos(yaw),
        sy = Math.sin(yaw);
      const cp = Math.cos(pitch),
        sp = Math.sin(pitch);
      const forward = [sy * cp, sp, cy * cp],
        right = [cy, 0, -sy],
        up = [-sy * sp, cp, -cy * sp];
      let camera = [x, y + 1.36, z];
      if (focus) {
        const depth = focalY / focus.scale;
        camera = focus.speaker.face.map(
          (v, i) => v - depth * (forward[i] + right[i] * across + up[i] * above),
        );
      } else if (this.thirdPerson) {
        // The raised follow point keeps the landing area visible above the plush.
        const elapsed = this.lastCameraTime === null ? 1 : clamp(time - this.lastCameraTime, 0, 0.16);
        this.cameraY =
          this.cameraY === null ? y : this.cameraY + (y - this.cameraY) * (1 - Math.exp(-12 * elapsed));
        const anchor = [x + 0.5 * sy, clamp(this.cameraY, y - 0.45, y + 0.45) + 1.58, z + 0.5 * cy];
        let arm = followDistance(anchor, forward, pads, hazards, time);
        if (course.tower) arm = towerCameraDistance(anchor, forward, arm, course.tower);
        camera = anchor.map((v, i) => v - arm * forward[i]);
      } else this.cameraY = null;
      this.view = { camera, right, up, forward, width, height, focalX, focalY, lensX, lensY };
      this.lastCameraTime = time;
      gl.uniform3fv(u.camera, camera);
      gl.uniform3fv(u.rightDir, right);
      gl.uniform3fv(u.upDir, up);
      gl.uniform3fv(u.forwardDir, forward);
      gl.uniform2f(u.lens, lensX, lensY);
      gl.uniform3fv(u.fog, rgb(course.fog));
      this.clouds.length = 0;
      gl.uniform1f(u.sceneTime, time);
      if (course.id === 'frost') {
        gl.depthMask(false);
        this.draw('aurora-sky', [0, 0, 0], unitSize, course.fog, 0, -18);
        gl.depthMask(true);
      }
      this.drawSky(camera, yaw, w / h, time);
      if (course.tower) window.FluffTowerScenery.draw(this);
      window.FluffSkyCharms.draw(this, pads, state);
      let portal;
      for (const pad of pads) {
        const { x: px, y: py, z: pz, w: pw, d: pd, index: i, kind } = pad,
          finish = !course.endless && i === pads.length - 1,
          checkpoint = course.checkpoints?.includes(i);
        if (pad.gone && py < -9) continue;
        if (Math.hypot(px - x, py - y, pz - z) > 85) continue;
        if (kind === 'stairs') {
          window.FluffSkyRides.drawStairs(this, pad, time);
          continue;
        }
        if (kind === 'slide') {
          const mesh = pad.slide?.through ? 'tower-slide' : 'slide';
          const material = pad.slide ? 9 + pad.slide.curve - 0.14 : 9;
          this.draw(mesh, [px, py, pz], [pw, 1, pd], '#f8bbbf', 0, material);
          const entrance = pz - pd / 2 + 0.15;
          for (const side of [-1, 1]) {
            const rail = px + side * pw * 0.485;
            const top = padHeight(pad, rail, entrance);
            this.draw('ball', [rail, top + 0.17, entrance], [0.38, 0.64, 0.38], '#fff0c2');
            this.draw('star', [rail, top + 0.58, entrance], [0.56, 0.56, 0.25], '#ffd57d', side * 0.17);
          }
          continue;
        }
        if (kind === 'tilt') {
          const pivotY = pad.restY ?? py;
          this.draw('box', [px, pivotY - 0.86, pz], [pw * 0.46, 0.22, pd * 0.48], '#725f82');
          this.draw('ball', [px, pivotY - 0.59, pz], [pw * 0.37, 0.67, pd * 0.38], '#a383a7');
        }
        this.setPadPlane(pad);
        const fabric = finish || kind === 'tower-roof' ? '#ffdf9a' : checkpoint ? '#a7e4cd'
          : kind === 'tilt' ? '#7cb4ba' : kind === 'gust' ? '#9ddbd6'
          : kind === 'crumble' ? '#ed9685' : pad.style?.color ?? course.fabric[i % course.fabric.length];
        const thickness = kind === 'tilt' ? 0.62 : kind === 'crumble' ? 0.72 : 0.87;
        const material = kind === 'tilt' ? 21 : kind === 'crumble' ? 22 + 0.95 * (pad.warning || 0) : 20;
        this.drawOpaque(
          `pad-${pad.style?.shape ?? 'rectangle'}`,
          [px, py - thickness / 2, pz],
          [pw, thickness, pd],
          fabric,
          0,
          material,
        );
        this.setPadPlane(null);
        if (kind === 'gust' && Math.hypot(px - x, pz - z) < 45) window.FluffGust.draw(this, pad, time);
        if (checkpoint) {
          const flagX = px - pw * 0.39,
            flagColor = state.checkpoint >= i ? '#ffd869' : '#49a994',
            flagY = padHeight(pad, flagX, pz);
          this.draw('box', [flagX, flagY + 0.53, pz], [0.075, 1.06, 0.075], '#b48b72');
          this.draw('box', [flagX + 0.24, flagY + 0.88, pz], [0.51, 0.28, 0.06], flagColor, -0.12);
        }
        if (i < pads.at(-1).index) {
          // The stitched dots at the take-off edge point toward the next pad.
          const next = pads[i + 1 - (course.firstIndex || 0)],
            dx = next.x - px,
            dz = next.z - pz,
            len = Math.hypot(dx, dz);
          this.setPadPlane(pad);
          for (let j = 0; j < 3; j++) {
            const dist = pd * (0.19 + j * 0.075);
            this.drawOpaque(
              'ball',
              [px + (dx / len) * dist, py + 0.007, pz + (dz / len) * dist],
              [0.14 + j * 0.028, 0.025, 0.14 + j * 0.028],
              '#fff5e4',
            );
          }
          this.setPadPlane(null);
        } else if (finish && this.destination) {
          portal = window.FluffCourses.finishPortal(pad);
          this.drawPortal(portal, state);
        }
      }
      if (this.batches?.render(this.view, this.colors.get(course.fog), time)) this.restoreRawState();
      const hazardColor = course.id === 'night' ? '#b982c2' : '#e27895';
      for (const h of hazards) {
        const pad = pads[h.at - (course.firstIndex || 0)];
        if (!pad || pad.gone || Math.hypot(pad.x - x, pad.y - y, pad.z - z) > 85) continue;
        if (window.FluffObstacles.types.includes(h.type)) {
          if (Math.abs(h.z - z) < 48) window.FluffObstacles.draw(this, h, pad, time);
          continue;
        }
        const diameter = h.r * 2;
        if (window.FluffCritters.types.includes(h.type)) {
          if (Math.abs(h.z - z) < 48) window.FluffCritters.draw(this, h, pad, time);
          continue;
        }
        if (h.type === 'shutter' || h.type === 'hoops') {
          window.FluffFairground.draw(this, h, pad, time);
          continue;
        }
        if (h.type === 'sweeper') {
          this.drawSweeper(h, pad);
          continue;
        }
        const shadowY = pad.y + 0.012;
        this.draw('box', [h.x, shadowY, h.z], [h.halfSpan * 2, 0.016, diameter], '#bfa0b3');
        if (h.type === 'hurdle') {
          for (const side of [-1, 1]) {
            const capX = h.x + side * h.halfSpan;
            this.draw('ball', [capX, shadowY, h.z], [diameter, 0.016, diameter], '#bfa0b3');
            this.draw('box', [capX, pad.y + 0.095, h.z], [0.25, 0.19, 0.3], '#ac7d99');
            this.draw('ball', [capX, h.y, h.z], [diameter, diameter, diameter], hazardColor, 0, 2);
          }
          this.draw('box', [h.x, h.y, h.z], [h.halfSpan * 2, diameter, diameter], hazardColor, 0, 2);
          continue;
        }
        if (h.type === 'pendulum') {
          this.drawSwingRopes(h, pad);
          this.draw('cylinder', [h.x, h.y, h.z], [h.halfSpan * 2, diameter, diameter], '#9c6894', 0, 6);
          for (const side of [-1, 1]) {
            this.draw(
              'ball',
              [h.x + side * h.halfSpan, h.y, h.z],
              [diameter, diameter, diameter],
              '#e7a4b8',
            );
          }
        } else {
          // Interlocking plush balls roll across the lane on a softer inner bolster.
          this.draw(
            'cylinder',
            [h.x, h.y, h.z],
            [h.halfSpan * 2, diameter * 0.9, diameter * 0.9],
            '#c48499',
          );
          const gaps = Math.max(1, Math.ceil((2 * h.halfSpan) / (diameter * 0.86)));
          for (let bead = 0; bead <= gaps; bead++) {
            const beadX = h.x + ((2 * bead) / gaps - 1) * h.halfSpan;
            this.draw(
              'ball',
              [beadX, h.y, h.z],
              [diameter, diameter, diameter],
              bead % 2 ? '#dfa0a5' : hazardColor,
              (h.z - pad.z) / h.r,
              2,
            );
          }
        }
      }
      if (!focus && (state.grounded === null || this.thirdPerson)) {
        for (const p of pads)
          if (
            !p.gone &&
            Math.abs(x - (p.kind === 'slide' ? window.FluffSkyRides.laneCenter(p, z) : p.x)) <
              p.w * 0.49 &&
            Math.abs(z - p.z) < p.d * 0.49 &&
            (!p.style || window.FluffPadStyles.contains(p.style, x - p.x, z - p.z, p.w, p.d)) &&
            (p.kind !== 'stairs' || !window.FluffSkyRides.dropped(p, z, time)) &&
            y >= padHeight(p, x, z) - 0.006
          ) {
            this.drawPadShadow(
              p,
              x,
              z,
              this.thirdPerson ? [0.93, 0.014, 0.65] : [0.41, 0.014, 0.36],
              '#baa8b7',
            );
            break;
          }
      }
      this.drawStars(state, pads);
      this.drawGifts(state, pads);
      window.FluffVillage.draw(this, pads, state);
      if (!focus) window.FluffSkyFriends.draw(this, pads, state);
      if (!focus && this.look && this.thirdPerson) this.character(state);
      this.cloudRenderer.draw(this, this.clouds, this.view);
      if (portal) this.drawPortalSilk(portal);
      if (!focus) {
        window.FluffPetalRain.draw(this);
        this.drawPickupBursts(state);
      }
      if (!focus && this.look && !this.thirdPerson) {
        // Draw the player's forepaws in camera space so they follow every turn and jump.
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.uniform3fv(u.camera, [0, 0, 0]);
        gl.uniform3fv(u.rightDir, [1, 0, 0]);
        gl.uniform3fv(u.forwardDir, [0, 0, 1]);
        gl.uniform3fv(u.upDir, [0, 1, 0]);
        window.FluffPlush.forepaws(this, this.look, w / h, state);
      }
    }
  }
  window.FluffWorld = World;
})();
