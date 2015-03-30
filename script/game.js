'use strict';

window.addEventListener('load', function () {

  var $ = document.getElementById.bind(document);

  var locked = false;

  var requestAnimFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
      setTimeout(callback, 1000 / 60);
    };

  NodeList.prototype.each = Array.prototype.each = function(fct) {
    Array.prototype.forEach.call(this, function (elt, i) {
      fct.call(elt, i, elt);
    });
    return this;
  };

  NodeList.prototype.map = function (fct) {
    var result = [];
    this.each(function () {
      result.push(fct.call(this));
    });
    return result;
  };

  NodeList.prototype.indexOf = function () {
    return Array.prototype.indexOf.apply(this, arguments);
  };

  HTMLElement.prototype.$ = function() {
    return this.querySelector.apply(this, arguments);
  };

  HTMLElement.prototype.$$ = function() {
    return this.querySelectorAll.apply(this, arguments);
  };

  HTMLElement.prototype.remove = function() {
    this.parentNode.removeChild(this);
  };

  HTMLElement.prototype.on = function(sel, evt, fct) {
    if(fct) {
      this.on(evt, function (e) {
        var target = e.target || e.srcElement;
        var elements = $$(sel, this);
        for(var target = e.target || e.srcElement; target && target !== this && target !== document; target = target.parentNode) {
          if(elements.indexOf(target) !== -1) {
            fct.call(target, e);
          }
        }
      });
    } else {
      fct = evt;
      evt = sel;
      this.addEventListener ?
        this.addEventListener(evt, fct, false) :
        (this.attachEvent ?
          this.attachEvent('on' + evt, fct) :
          (this['on' + evt] = fct));
    }
    return this;
  };

  HTMLElement.prototype.html = function() {
    return arguments.length ?
      (this.innerHTML = arguments[0], this):
      this.innerHTML;
  };

  HTMLElement.prototype.data = function() {
    if(arguments.length < 2) {
      var val = this.getAttribute('data-' + arguments[0]);
      if(val && typeof(val) === 'string') {
        return JSON.parse(val);
      }
      return val;
    }
    this.setAttribute('data-' + arguments[0], JSON.stringify(arguments[1]));
    return this;
  };

  HTMLElement.prototype.height = function(height) {
    this.style.height = isNaN(height) ? height : height + 'px';
    return this;
  };

  HTMLCanvasElement.prototype.clear = function() {
    var ctx = this.getContext("2d");
    ctx.clearRect(0, 0, this.width, this.height);
  };

  HTMLCanvasElement.prototype.drawToken = function(y, fillStyle) {
    var ctx = this.getContext("2d");
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(80 / 2, y, 74 / 2, 0, Math.PI * 2, true);
    ctx.fill();
  };

  for(var fctName in HTMLElement.prototype) {
    NodeList.prototype[fctName] = Array.prototype[fctName] = (function(fctName) {
      return function() {
        var params = arguments;
        var list = this;
        var result = list;
        list.each(function () {
          var subResult = HTMLElement.prototype[fctName].apply(this, params);
          if(subResult !== this && result === list) {
            result = subResult;
          }
        });
        return result;
      };
    })(fctName);
  }

  function getWinner(grid, columns, rows) {
    // vertical
    var col;
    for(var x = 0; x < columns; x++) {
      for(var y = 0; y < rows - 3; y++) {
        col = grid[y * rows + x] || false;
        if(col) {
          for(var i = 0; i < 4; i++) {
            var c = grid[(y + i) * rows + x] || false;
            if(col !== c) {
              col = false;
              break;
            }
          }
          if(col) {
            return { vertical: col };
          }
        }
      }
    }
    // horizontal
    for(var x = 0; x < columns - 3; x++) {
      for(var y = 0; y < rows; y++) {
        col = grid[y * rows + x] || false;
        if(col) {
          for(var i = 0; i < 4; i++) {
            var c = grid[y * rows + (x + i)] || false;
            if(col !== c) {
              col = false;
              break;
            }
          }
          if(col) {
            return { horizontal: col };
          }
        }
      }
    }
    // diagonal
    for(var x = 0; x < columns - 3; x++) {
      for(var y = 0; y < rows - 3; y++) {
        col = grid[y * rows + x] || false;
        if(col) {
          for(var i = 0; i < 4; i++) {
            var c = grid[(y + i) * rows + (x + i)] || false;
            if(col !== c) {
              col = false;
              break;
            }
          }
          if(col) {
            return { diagonal: col };
          }
        }
        col = grid[y * rows + (x + 3)] || false;
        if(col) {
          for(var i = 0; i < 4; i++) {
            var c = grid[(y + i) * rows + (x + 3 - i)] || false;
            if(col !== c) {
              col = false;
              break;
            }
          }
          if(col) {
            return { diagonal: col };
          }
        }
      }
    }
    return null;
  }

  var tokens = [];

  function checkForVictory() {
    var grid = [];
    var canvas = $('grid').getElementsByTagName('canvas');
    var columns = canvas.length;
    var rows = canvas[0].height / canvas[0].width;
    for(var x = tokens.length - 1; x >= 0; x--) {
      if(tokens[x]) {
        for(var y = tokens[x].length - 1; y >= 0; y--) {
          grid[y * rows + x] = tokens[x][y];
        }
      }
    }
    var winner = getWinner(grid, columns, rows);
    if(winner) {
      for(var direction in winner) {
        var color = winner[direction];
        for(var i = players.length - 1; i >= 0; i--) {
          if(players[i].color === color) {
            alert(players[i].name + ' win with 4 ' + direction + ' tokens!');
            return;
          }
        }
        break;
      }
    } else {
      locked = false;
      currentPlayer++;
      if(currentPlayer >= players.length) {
        currentPlayer = 0;
      }
    }
  }

  var currentPlayer;

  window.start = function (min, max) {
    locked = false;
    currentPlayer = 0;
    var width = parseInt(min);
    var height = parseInt(max);
    var gridHeight = 80 * height;
    var grid = '';
    for(var x = 0; x < width; x++) {
      grid += '<canvas width="' + 80 + '" height="' + gridHeight + '"></canvas>';
    }
    $('grid').innerHTML = grid;
  };

  var players = [];

  window.removePlayer = function (elt, index) {
    players.splice(index, 1);
    elt.parentNode.parentNode.removeChild(elt.parentNode);
  }

  window.addPlayer = function (name, color) {
    $('players').innerHTML += '<div class="player">' +
      '<span class="token" style="background: ' + color + '"></span>' +
      name.replace(/</g, '&lt;') +
      ' &nbsp; <a class="remove" href="#" onclick="removePlayer(this, ' + players.length + '); return false;">Remove</a>' +
    '</div>';
    players.push({
      name: name,
      color: color
    });
    var cols = ['#FF0000', '#008800', '#00FF00', '#FF88CC', '#00FFFF', '#880088', '#00FF00', '#FFFF00'];
    document.getElementsByName('color')[0].value = cols[players.length];
    document.getElementsByName('name')[0].value = '';
    document.getElementsByName('name')[0].focus();
  };

  document.body.addEventListener('click', function (e) {
    var target = e.target || e.srcElement;
    if(target.tagName.toLowerCase() === 'canvas' && ! locked) {
      if(players.length > 1) {
        var fillStyle = players[currentPlayer].color;
        var canvas = $('grid').getElementsByTagName('canvas');
        var column = Array.prototype.indexOf.call(canvas, target);
        var rowCount = target.height / 80;
        tokens[column] = tokens[column] || [];
        var tokenInThisColumn = tokens[column].length;
        if(tokenInThisColumn < rowCount) {
          locked = true;
          var newTokens = tokens[column].slice();
          newTokens.push(fillStyle);
          var finalRow = rowCount - tokenInThisColumn;
          var y = -40;

          function drawToken() {
            y += 20;
            if(y > (finalRow - 0.5) * 80) {
              tokens[column] = newTokens;
              checkForVictory();
            } else {
              target.clear();
              target.drawToken(y, fillStyle);
              for(var i = tokens[column].length - 1; i >= 0; i--) {
                target.drawToken((rowCount - i - 0.5) * 80, tokens[column][i]);
              }
              requestAnimFrame(drawToken);
            }
          }

          drawToken();
        }
      } else {
        alert('Please add at least two players');
      }
    }
  });

  localStorage = localStorage || {};

}, false);
