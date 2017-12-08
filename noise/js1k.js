var map = new Array(2e6);
map.fill(0xff);

var divide = (size) => {
  if (size < 2) return;
  var half = size / 2;

  for (var y = half; y < 1025; y += size) {
    for (var x = half; x < 1025; x += size) {
      //SQUARE
      tmp = (
        map[((x - half) & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + ((y + half) & 1023) * 1025] +
        map[((x - half) & 1023) + ((y + half) & 1023) * 1025]
      ) / 4 + Math.random() * 4 * size - 1.5 * size;
      map[x + 1025 * y] = (tmp<0) ? 0 : ((tmp>1024) ? 1024 : tmp);
    }
  }
  for (var y = 0; y <= 1025; y += half) {
    for (var x = (y + half) % size; x <= 1025; x += size) {
      //DIAMOND
      tmp = (
        map[(x & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + (y & 1023) * 1025] +
        map[(x & 1023) + ((y + half) & 1023) * 1025] +
        map[((x - half) & 1023) + (y & 1023) * 1025]
      ) / 4 + Math.random() * 4 * size - 1.5 * size;
      map[x + 1025 * y] = (tmp<0) ? 0 : ((tmp>1024) ? 1024 : tmp);
    }
  }
  divide(half);
};

//map[0] = map[0] = 1024;
divide(1024);

//var pallete = [0x0, 0x60, 0x6067ac, 0x60, 0x00];
var pallete = [0x0, 0x60, 0x103090, 0x60, 0x00];
var tmp=0;
var imgdata = c.getImageData(0,0, 1024, 1024);

var black = false;
map.forEach((r,i)=>{
  //convert the 1025*1025 map to a 1024*1024 heightmap and color map
  if (i%1025!=1024) {
    //hm[tmp++] =
    tmp++;
//    var heightMapEntry = Math.floor(255 * (r/1024));
    var heightMapEntry = Math.floor(r/4.01);

    //generate smooth color dynamically, 4 equals the size of the pallete array
    var ofs = Math.floor(heightMapEntry/(255 / 5));
    var col1 = pallete[(ofs+1)%5];
    var col2 = pallete[(ofs)%5];
    var selectedPalleteEntry = 5*(heightMapEntry%(255 / 5));
    var oppositeColor = 255-selectedPalleteEntry;

/*


(sun)

          |\
          | \
        +----------------------+
 shadow   ---
*/
/*    colormap[i] = 0xff000000 |
            (((((col1>>16)&255)*selectedPalleteEntry + ((col2>>16)&255)*oppositeColor) >>8) << 16) |
            (((((col1>>8)&255)*selectedPalleteEntry  + ((col2>>8)&255)*oppositeColor) >>8) << 8) |
            ((  (col1&255)*selectedPalleteEntry      + (col2&255)*oppositeColor) >>8);
    //cheat a bit, make brightest color visible - but cost about 8-12 bytes!
    if (heightMapEntry==255) colormap[i]|=0x100b0b;
*/
    imgdata.data[4*tmp+2] = (((((col1>>16)&255)*selectedPalleteEntry + ((col2>>16)&255)*oppositeColor) >>8) );
    imgdata.data[4*tmp+1] = (((((col1>>8)&255)*selectedPalleteEntry + ((col2>>8)&255)*oppositeColor) >>8) );
    imgdata.data[4*tmp+0] = (((col1&255)*selectedPalleteEntry + (col2&255)*oppositeColor) >>8);
    imgdata.data[4*tmp+3] = 255;  // APLHA (0-255)

    // this is the dead cheap shadow mapper
    if (ofs+heightMapEntry>100+r%16 && map[(i + 8)] < r) {
      imgdata.data[4*tmp+3]=0xe0;
    }
/*    if (heightMapEntry - 20 > black ) black = false;

    if (black || tmp > 2 && heightMapEntry>70 && map[(tmp - 1) & map.length] + 4 > heightMapEntry) {
      if (tmp % 1024 > 512) {
        //imgdata.data[4*tmp+3]=0;//=0;
        //imgdata.data[4*tmp+1]/=2;//=222;
        imgdata.data[4*tmp+0]=0;
        //imgdata.data[4*tmp+1]/=2;
        //imgdata.data[4*tmp+2]/=2;
      }
      if (!black) black = heightMapEntry;
    }*/
  }
});

/*
var xx = [];
var ofs = 0;
tmp = 0;
map.forEach((r,i)=>{
  if (i%1025!=1024) {
    xx[tmp++] = Math.floor(255 * (r/1024));
  }
});*/

/*
var colormap = [];
xx.forEach((r,i)=>{
  r += (Math.random()*2)|0;
  if (i>1024*200 && i<1024*300) colormap[i] = col[127]; else
  colormap[i] = col[r];
});


var imgdata = c.getImageData(0,0, 1024, 1024);
var imgdatalen = imgdata.data.length;
var ofs = blackPixel = 0;
for(var i=0;i<imgdatalen/4;i++){  //iterate over every pixel in the canvas
  var o = colormap[i];//xx[ofs++];
  if (o===0) blackPixel++;
  ofs++
    imgdata.data[4*i] = colormap[i] & 255;
    imgdata.data[4*i+1] = (colormap[i]>>8) & 255;
    imgdata.data[4*i+2] = (colormap[i]>>16) & 255;    // BLUE (0-255)
    imgdata.data[4*i+3] = 255;  // APLHA (0-255)
}
*/

c.putImageData(imgdata,0,0);
