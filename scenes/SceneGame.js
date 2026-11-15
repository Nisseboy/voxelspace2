let minGround = 10;
let maxGround = 60;

let noiseFreq = 50;
let noiseLayers = 3;
let noiseLayerMult = 0.5;

let colorLayers = [
  new Vec(0, 0, 255),
  new Vec(0, 200, 0),
  new Vec(140, 140, 140),
  new Vec(200, 200, 200),
];

class SceneGame extends Scene {
  constructor() {
    super();

    this.backgroundColor = "rgba(20, 20, 20, 1)";

    this.size = new Vec();
    this.imgs = {
      height: new Img(),
      color: new Img(),
      render: new Img(),
    }
    this.imageData = {};

    this.dir = 0;
  }

  start() {
    this.createWorld(new Vec(160, 160));

    this.ui = createDefaultUIRoot([
      new UIBase({
        style: {...buttonStyle,
          fill: "#945",
        },

        children: [
          new UISettingChoice({
            name: "choice", displayName: "Choice",
            value: "Generated",
            choices: [
              "Generated",
              "Pyramid",
            ],

            style: {...buttonStyle, growX: true, gap: 5},

            events: {change: [(e) => {
              if (e == "Generated") this.createWorld(new Vec(160, 160));
              else this.loadImgs(nde.tex["D1"], nde.tex["C1W"])
            }]}
          })
        ]
      }),
      
    ]);
    
  }

  createWorld(size) {
    this.size.set(size.x, size.y, maxGround);

    for (let i in this.imgs) {
      this.imgs[i] = new Img(size);
    }
    this.loadImageData();

    let x,y,k,height,color;
    for (y = 0; y < size.y; y++) {
      for (x = 0; x < size.x; x++) {
        let noiseValue = 0;
        for (let i = 0; i < noiseLayers; i++) {
          let mult = noiseFreq * noiseLayerMult ** i;
          noiseValue += noise.perlin2(x/mult + 632.3523522*i, y/mult) * noiseLayerMult ** i;
        }
        height = Math.min(minGround + Math.max(Math.ceil((noiseValue+1)*0.7 * (maxGround - minGround) - 5), 14), maxGround) - 2;
        color = colorLayers[Math.floor((height - minGround) / (maxGround - minGround) * colorLayers.length)];

        k = (x + y * size.y) * 4;
        this.imageData.height.data[k] = height;
        this.imageData.height.data[k+3] = 255;
        this.imageData.color.data[k  ] = color.r;
        this.imageData.color.data[k+1] = color.g;
        this.imageData.color.data[k+2] = color.b;
        this.imageData.color.data[k+3] = 255;
      }
    }

    for (let i in this.imgs) {
      let img = this.imgs[i];
      
      img.ctx.putImageData(this.imageData[i], 0, 0);
    }

    this.loadImageData();

    this.renderToImg();
  }

  loadImgs(height, color) {
    this.size.from(height.size);

    this.imgs.height = height;
    this.imgs.color = color;

    this.loadImageData();

    this.renderToImg();
  }

  loadImageData() {
    this.size.from(this.imgs.height.size);

    this.imageData.height = this.imgs.height.ctx.getImageData(0, 0, this.size.x, this.size.y);
    this.imageData.color  = this.imgs.color .ctx.getImageData(0, 0, this.size.x, this.size.y);
    
    this.size.z = 0;
    for (let i = 0; i < this.imageData.height.data.length; i+=4) this.size.z = Math.max(this.size.z, this.imageData.height.data[i]);
    
    this.imgs.render.resize(new Vec(this.size.x * 1.5, (this.size.y + this.size.z*2) * 1.5).floor());
    this.imageData.render = this.imgs.render.ctx.getImageData(0, 0, this.imgs.render.size.x, this.imgs.render.size.y);
  }

  renderToImg() {
    let pixels = this.imageData.render.data;
    let heightData = this.imageData.height.data;
    let colorData = this.imageData.color.data;
    pixels.fill(0);

    let heightBuffer = new Array(this.size.x).fill(10000);

    let skewX = -Math.tan(this.dir/2);
    let skewY = Math.sin(this.dir);

    let sizeX = this.size.x;
    let renderSizeX = this.imgs.render.size.x;
    let sizeY = this.size.y;
    let renderSizeY = this.imgs.render.size.y;
    let sizeZ = this.size.z;
    let offsetX = Math.round((renderSizeX - sizeX) / 2);
    let offsetY = Math.round((renderSizeY - sizeY) / 2);
    let halfSizeX = renderSizeX / 2;
    let halfSizeY = renderSizeY / 2;

    let x,y,rx,ry,k1,k2,i,height,colorMult,maxDrawnHeight;
    for (y = this.size.y; y >= 0; y--) {
    //for (y = 0; y < sizeY; y++) {
      for (x = 0; x < this.size.x; x++) {
        k1 = (x + y * sizeX) * 4;
        height = heightData[k1] + 1;
        maxDrawnHeight = 0;

        rx = offsetX + x;
        ry = offsetY + y;

        rx += Math.round((ry - halfSizeY) * skewX);
        ry += Math.round((rx - halfSizeX) * skewY);
        rx += Math.round((ry - halfSizeY) * skewX);
        
        colorMult = 1;
        for (i = sizeZ - height; i < sizeZ; i++) {
          if (ry + i >= heightBuffer[rx]) break;
          if (!maxDrawnHeight) maxDrawnHeight = ry + i;

          k2 = (rx + (ry + i) * renderSizeX) * 4;
          pixels[k2  ] = colorData[k1  ] * colorMult;
          pixels[k2+1] = colorData[k1+1] * colorMult;
          pixels[k2+2] = colorData[k1+2] * colorMult;
          pixels[k2+3] = colorData[k1+3];

          colorMult = 0.6;
        }
        
        if (maxDrawnHeight) heightBuffer[rx] = maxDrawnHeight;

      }
    }

    this.imgs.render.ctx.putImageData(this.imageData.render, 0, 0);
  }

  inputdown(key) {
    
  }
  inputup(key) {
    
  }

  checkRotation(dt) {
    let dir = 0;
    if (nde.getKeyPressed("Move Left")) dir = -1;
    if (nde.getKeyPressed("Move Right")) dir = 1;
    if (!dir) return;

    this.dir += dt * dir;

    let wholeDir = 0;
    if (this.dir < -Math.PI*0.25) wholeDir =  1;
    if (this.dir >  Math.PI*0.25) wholeDir = -1;
    
    if (wholeDir) {
      this.rotateImgs(Math.PI*0.5 * -wholeDir);
      this.dir += Math.PI*0.5 * wholeDir;
      
      this.loadImageData();
    }

    this.renderToImg();
  }

  rotateImgs(radians) {
    this.rotateImg(this.imgs.height, radians);
    this.rotateImg(this.imgs.color , radians);
  }
  rotateImg(img, radians) {
    img._(() => {
      img.translate(img.size._mul(0.5));
      img.rotate(radians);
      img.image(img, img.size._mul(-0.5), img.size)
    });
  }

  update(dt) {  
    super.update(dt);

    this.checkRotation(dt);
  }

  render() {
    super.render();


    this.cam._(renderer, () => {
      renderer.setAll({
        font: "1px monospace",
        textAlign: [1, 1],
        fill: 200,
      });
      renderer.text("A/D to Rotate", new Vec(0, -4));

      let m = renderer.getTransform();
      m.rotateAxisAngleSelf(1, 0, 0, 70)
      renderer.setTransform(m)

      let renderSize = this.imgs.render.size._mul(10/this.size.x);
      renderer.translate(renderSize._mul(-0.5));
      renderer.image(this.imgs.render, vecZero, renderSize);
    });

    uicam._(renderer, () => {
      this.ui.renderUI();
    });
  }
}