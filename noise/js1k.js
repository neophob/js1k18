var map = new Uint32Array(1025 * 1025);
map.fill(0);

function tget(x, y) {
  // wrap around to make map tileable
  //TODO 1023 should be 1025?
  return map[(x & 1023) + (y & 1023) * 1025];
}
var divide = (size) => {
  if (size < 2) return;
  var half = size / 2;
  //roughness is 2.4
  var scale = 2.2 * size;

  for (var y = half; y < 1024; y += size) {
    for (var x = half; x < 1024; x += size) {
      //SQUARE
      tmp = (
        //tget(x - half, y - half) +   // upper left
        //tget(x + half, y - half) +   // upper right
        //tget(x + half, y + half) +   // lower right
        //tget(x - half, y + half)    // lower left
        map[((x - half) & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + ((y + half) & 1023) * 1025] +
        map[((x - half) & 1023) + ((y + half) & 1023) * 1025]
      ) / 4 + Math.random() * scale * 2 - scale;

      map[x + 1025 * y] = (tmp<0) ? 0 : (tmp>1024) ? 1024 : tmp;
    }
  }
  for (var y = 0; y <= 1024; y += half) {
    for (var x = (y + half) % size; x <= 1024; x += size) {
      //DIAMOND
      tmp = (
//        tget(x, y - half) +     // top
//        tget(x + half, y) +      // right
//        tget(x, y + half) +     // bottom
//        tget(x - half, y)       // left
        map[(x & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + (y & 1023) * 1025] +
        map[(x & 1023) + ((y + half) & 1023) * 1025] +
        map[((x - half) & 1023) + (y & 1023) * 1025]
      ) / 4 + Math.random() * scale * 2 - scale;
      map[x + 1025 * y] = (tmp<0) ? 0 : (tmp>1024) ? 1024 : tmp;
    }
  }
  divide(size / 2);
};

//map[0] = map[0] = 1024;
divide(1024);
var xx = [];
var ofs = 0;
tmp = map[0];
map.forEach((r,i)=>{
  if (i%1025!=1024) {
    t=r;
    if (i>1025*300)t = ((r + map[i-1] + map[i+1])/4)|0;
    xx[ofs++] = Math.floor(255 * (t/1024));
    tmp = r;
  }
});


/*function Terrain() {
  this.size = 1024 + 1;
  this.max = this.size - 1;
  this.map = new Float32Array(this.size * this.size);
}
Terrain.prototype.get = function(x, y) {
  return this.map[(x & (this.max - 1)) + (y & (this.max - 1)) * this.size];
};
Terrain.prototype.set = function(x, y, val) {
  if (val<0){val=0}
  if (val>this.max){val=this.max}
  this.map[x + this.size * y] = val;
};
Terrain.prototype.getMap = function() {
  var ret = [];
  var ofs = 0;
  for(var i=0;i<this.map.length;i++){  //iterate over every pixel in the canvas
    var o = Math.floor(255 * (this.map[i]/1024));
    ret[ofs++] = o;
    if (i%1024 === 1023) i+=1;
  }
  return ret;
};
Terrain.prototype.generate = function(roughness) {
  var self = this;
  this.set(0, 0, self.max /2);
  this.set(this.max, 0, self.max / 2);
  this.set(this.max, this.max, self.max / 2);
  this.set(0, this.max, self.max / 2);
  divide(this.max);

  function divide(size) {
    var x, y, half = size / 2;
    var scale = roughness * size;
    if (half < 1) return;
    for (y = half; y < self.max; y += size) {
      for (x = half; x < self.max; x += size) {
        //square(x, y, half, Math.random() * scale * 2 - scale);
        var ave =
          self.get(x - half, y - half) +   // upper left
          self.get(x + half, y - half) +   // upper right
          self.get(x + half, y + half) +   // lower right
          self.get(x - half, y + half);    // lower left
        var offset = Math.random() * scale * 2 - scale;
        self.set(x, y, ave/4+ offset);
      }
    }
    for (y = 0; y <= self.max; y += half) {
      for (x = (y + half) % size; x <= self.max; x += size) {
        //diamond(x, y, half, Math.random() * scale * 2 - scale);
        var ave =
          self.get(x, y - half) +     // top
          self.get(x + half, y) +      // right
          self.get(x, y + half) +     // bottom
          self.get(x - half, y);       // left
        var offset = Math.random() * scale * 2 - scale;
        self.set(x, y, ave/4 + offset);
      }
    }
    divide(size / 2);
  }
};

var terrain = new Terrain(10);
terrain.generate(1.2);
*/

//var xx = terrain.getMap();
//var xx = contoliNoise();

var imgdata = c.getImageData(0,0, 1024, 1024);
var imgdatalen = imgdata.data.length;
var ofs = 0;
for(var i=0;i<imgdatalen/4;i++){  //iterate over every pixel in the canvas
  var o = xx[ofs++];
  imgdata.data[4*i] = o;    // RED (0-255)
  imgdata.data[4*i+1] = o;    // GREEN (0-255)
  imgdata.data[4*i+2] = o;    // BLUE (0-255)
  imgdata.data[4*i+3] = 255;  // APLHA (0-255)
}
c.putImageData(imgdata,0,0);
