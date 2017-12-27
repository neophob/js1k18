var map = new Array(2e6);
map.fill(0);

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
      map[x + 1025 * y] = (tmp<255) ? 255 : ((tmp>1024) ? 1024 : tmp);
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
      map[x + 1025 * y] = (tmp<255) ? 255 : ((tmp>1024) ? 1024 : tmp);
    }
  }
  divide(half);
};

//map[0] = map[0] = 1024;
divide(1024);

// 16 x 16
for (var l=0;l < 1025; l++) {
  var yofs = l%64 ? yofs : Math.random()*16 << 6;
  for (var j=yofs; j < yofs+64; j++) {
    //map[j * 1025 + l] = 1024;
  }
}

var tmp=0;
var imgdata = c.getImageData(0,0, 1024, 1024);

map.forEach((r,i)=>{
  //convert the 1025*1025 map to a 1024*1024 heightmap and color map
  if (i%1025!=1024) {
    //hm[tmp++] =
    tmp++;
//    var heightMapEntry = Math.floor(255 * (r/1024));
    let heightMapEntry = map[i]/4;

    //generate smooth color dynamically, 4 equals the size of the pallete array
    var ofs = Math.floor(heightMapEntry/(255 / 5));
    let col1 = [[], [102], [192,51,16], [102],[]][ ((heightMapEntry/(255 / 5)+1)|0)%5];
    let col2 = [[], [102], [192,51,16], [102],[]][  (heightMapEntry/(255 / 5)   |0)%5];
    let selectedPalleteEntry = (heightMapEntry%(255 / 5))/(255 / 5);
    var oppositeColor = 1-selectedPalleteEntry;

    imgdata.data[4*tmp+0] = heightMapEntry;
    imgdata.data[4*tmp+1] = heightMapEntry;
    imgdata.data[4*tmp+2] = heightMapEntry;
    imgdata.data[4*tmp+3] = 255;  // APLHA (0-255)

    if ((tmp%1024) > 340) {
      imgdata.data[4*tmp+0] = (((col1[0]|0)*selectedPalleteEntry + (col2[0]|0)*(1-selectedPalleteEntry)));
      imgdata.data[4*tmp+1] = (((col1[1]|0)*selectedPalleteEntry + (col2[1]|0)*(1-selectedPalleteEntry)));
      imgdata.data[4*tmp+2] = ( (col1[2]|0)*selectedPalleteEntry + (col2[2]|0)*(1-selectedPalleteEntry));

    }

    // this is the dead cheap shadow mapper
    if ((tmp%1024) > 680 && ofs+heightMapEntry>100+r%16 && map[(i - 1)] < r) {
      imgdata.data[4*tmp+3]=0xe0;
    }

  }
});

c.putImageData(imgdata,0,0);
