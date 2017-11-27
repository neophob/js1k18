var map = [];
map[2049 * 2049] = 0;
map.fill(0);

var divide = (size) => {
  if (size < 2) return;
  var half = size / 2;
  //roughness is 2.4
  var scale = 1.7 * size;

  for (var y = half; y < 2048; y += size) {
    for (var x = half; x < 2048; x += size) {
      //SQUARE
      tmp = (
        map[((x - half) & 2047) + ((y - half) & 2047) * 2049] +
        map[((x + half) & 2047) + ((y - half) & 2047) * 2049] +
        map[((x + half) & 2047) + ((y + half) & 2047) * 2049] +
        map[((x - half) & 2047) + ((y + half) & 2047) * 2049]
      ) / 4 + Math.random() * scale * 2.5 - scale;
      map[x + 2049 * y] = (tmp<0) ? 0 : (tmp>2048) ? 2048 : tmp;
    }
  }
  for (var y = 0; y <= 2048; y += half) {
    for (var x = (y + half) % size; x <= 2048; x += size) {
      //DIAMOND
      tmp = (
        map[(x & 2047) + ((y - half) & 2047) * 2049] +
        map[((x + half) & 2047) + (y & 2047) * 2049] +
        map[(x & 2047) + ((y + half) & 2047) * 2049] +
        map[((x - half) & 2047) + (y & 2047) * 2049]
      ) / 4 + Math.random() * scale * 2.5 - scale;
      map[x + 2049 * y] = (tmp<0) ? 0 : (tmp>2048) ? 2048 : tmp;
    }
  }
  divide(size /2);
}

//map[0] = map[0] = 2048;
divide(2048);
var xx = [];
var ofs = 0;
tmp = 0;
map.forEach((r,i)=>{
  if (i%2049!=2048) {
    xx[tmp++] = Math.floor(255 * (r/2048));
  }
});

var pallete = [0, 0x2d33aa, 0xa2a7cc, 0];

var calcSmoothColor = (col1, col2, selectedPalleteEntry) => {
  //4 is pallete length
  selectedPalleteEntry*=4;
	var oppositeColor = 255-selectedPalleteEntry;
	return 0xff000000 |
          (((((col1>>16)&255)*selectedPalleteEntry + ((col2>>16)&255)*oppositeColor) >>8) << 16) |
          (((((col1>>8)&255)*selectedPalleteEntry + ((col2>>8)&255)*oppositeColor) >>8) << 8) |
          (((col1&255)*selectedPalleteEntry + (col2&255)*oppositeColor) >>8);
}

//4 is pallete length
var col = [];
// 256 colors per palette (8bit)
for (var i=0; i<256; i++) {
	var ofs=0;
	var selectedPalleteEntry = i;
	while (selectedPalleteEntry > (255 / 4)) {
		selectedPalleteEntry -= (255 / 4);
		ofs++;
	}
  //4 is pallete length
	col[i] = calcSmoothColor(pallete[(ofs+1)%4], pallete[(ofs)%4], selectedPalleteEntry);
}

var colormap = [];
xx.forEach((r,i)=>{
  r += (Math.random()*2)|0;
  if (i>2048*200 && i<2048*300) colormap[i] = col[127]; else
  colormap[i] = col[r];
});


var imgdata = c.getImageData(0,0, 2048, 2048);
var imgdatalen = imgdata.data.length;
var ofs = 0;
for(var i=0;i<imgdatalen/4;i++){  //iterate over every pixel in the canvas
  var o = colormap[i];//xx[ofs++];
  ofs++
    imgdata.data[4*i] = colormap[i] & 255;
    imgdata.data[4*i+1] = (colormap[i]>>8) & 255;
    imgdata.data[4*i+2] = (colormap[i]>>16) & 255;    // BLUE (0-255)*/
    imgdata.data[4*i+3] = 255;  // APLHA (0-255)
}



c.putImageData(imgdata,0,0);
