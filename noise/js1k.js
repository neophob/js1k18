var map = [];
map[1025 * 1025] = 0;
map.fill(0);

var divide = (size) => {
  if (size < 2) return;
  var half = size / 2;
  //roughness is 2.4
  var scale = 1.7 * size;

  for (var y = half; y < 1024; y += size) {
    for (var x = half; x < 1024; x += size) {
      //SQUARE
      tmp = (
        map[((x - half) & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + ((y + half) & 1023) * 1025] +
        map[((x - half) & 1023) + ((y + half) & 1023) * 1025]
      ) / 4 + Math.random() * scale * 2.5 - scale;
      map[x + 1025 * y] = (tmp<0) ? 0 : (tmp>1024) ? 1024 : tmp;
    }
  }
  for (var y = 0; y <= 1024; y += half) {
    for (var x = (y + half) % size; x <= 1024; x += size) {
      //DIAMOND
      tmp = (
        map[(x & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + (y & 1023) * 1025] +
        map[(x & 1023) + ((y + half) & 1023) * 1025] +
        map[((x - half) & 1023) + (y & 1023) * 1025]
      ) / 4 + Math.random() * scale * 2.5 - scale;
      map[x + 1025 * y] = (tmp<0) ? 0 : (tmp>1024) ? 1024 : tmp;
    }
  }
  divide(size /2);
}

//map[0] = map[0] = 1024;
divide(1024);
var xx = [];
var ofs = 0;
tmp = 0;
map.forEach((r,i)=>{
  if (i%1025!=1024) {
    xx[tmp++] = Math.floor(255 * (r/1024));
  }
});

var pallete = [0, 0xaa332d, 0xa2a7cc, 0];

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
  colormap[i] = col[r];
});


var imgdata = c.getImageData(0,0, 1024, 1024);
var imgdatalen = imgdata.data.length;
var ofs = 0;
for(var i=0;i<imgdatalen/4;i++){  //iterate over every pixel in the canvas
  var o = colormap[i];//xx[ofs++];
  ofs++
  if (i>1024*512) {
    var h = xx[ofs]/128;
    imgdata.data[4*i] = h*(colormap[i] & 255);
    imgdata.data[4*i+1] = h*((colormap[i]>>8) & 255);
    imgdata.data[4*i+2] = h*((colormap[i]>>16) & 255);    // BLUE (0-255)*/
    imgdata.data[4*i+3] = 255;  // APLHA (0-255)

  } else {
    imgdata.data[4*i] = colormap[i] & 255;
    imgdata.data[4*i+1] = (colormap[i]>>8) & 255;
    imgdata.data[4*i+2] = (colormap[i]>>16) & 255;    // BLUE (0-255)*/
    imgdata.data[4*i+3] = 255;  // APLHA (0-255)
  }
}



c.putImageData(imgdata,0,0);
