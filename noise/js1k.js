var map = new Uint32Array(1025 * 1025);
map.fill(0);

function tget(x, y) {
  // wrap around to make map tileable
  //TODO 1023 should be 1025?
  return map[(x & 1023) + (y & 1023) * 1025];
}
function tset(x, y, val) {
  if (val<0){val=0}
  if (val>1024){val=1024}
  map[x + 1025 * y] = val;
}
function divide(size) {
  if (size < 2) return;
  var half = size / 2;
  //roughness
  var x, y, scale = 2.4 * size;
  for (y = half; y < 1024; y += size) {
    for (x = half; x < 1024; x += size) {
      //square(x, y, half, Math.random() * scale * 2 - scale);
      var avg =
        tget(x - half, y - half) +   // upper left
        tget(x + half, y - half) +   // upper right
        tget(x + half, y + half) +   // lower right
        tget(x - half, y + half);    // lower left
      var offset = Math.random() * scale * 2 - scale;
      tset(x, y, avg/4+ offset);
    }
  }
  for (y = 0; y <= 1024; y += half) {
    for (x = (y + half) % size; x <= 1024; x += size) {
      //diamond(x, y, half, Math.random() * scale * 2 - scale);
      var avg =
        tget(x, y - half) +     // top
        tget(x + half, y) +      // right
        tget(x, y + half) +     // bottom
        tget(x - half, y);       // left
      var offset = Math.random() * scale * 2 - scale;
      tset(x, y, avg/4 + offset);
    }
  }
  divide(size / 2);
}
tset(0, 0, 1024/2);
tset(1024, 0, 1024 / 2);
tset(1024, 1024, 1024 / 2);
tset(0, 1024, 1024 / 2);
divide(1024);
var xx = [];
var ofs = 0;
for(var i=0;i<map.length;i++){  //iterate over every pixel in the canvas
  var o = Math.floor(255 * (map[i]/1024));
  xx[ofs++] = o;
//  if (i%1024 === 1023) i+=1;
  if (!(i%1024)) i+=1;
}

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
