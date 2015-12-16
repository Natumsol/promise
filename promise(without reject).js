(function(global) {
  function Promise(fun) {
    this.status = "pending";
    this.result = null;
    this.currentTask = fun || function(o) {
      return o;
    };
    this.taskList = [];
  }
  Promise.prototype = {
    constructor: Promise,
    resolve: function(data) {
      if (this.status != "pending") throw "promise has already finished!";
      this.result = this.currentTask(data);
      this.status = "resolved";
      for (var i = 0; i < this.taskList.length; i++) {
        this._fire(this.taskList[i].promise, this.taskList[i].task);
      }
      return this;
    },
    _fire: function(promise, task) {
      var nextResult = task(this.result);
      if (nextResult instanceof Promise) {
        nextResult.then(function(data) {
          promise.resolve(nextResult);
        });
      } else {
        promise.resolve(nextResult);
      }
      return promise;
    },
    then: function(task) {
      var promise = new Promise();
      if (this.status == "resolved") {
        return this._fire(promise, task);
      } else {
        return this._push(promise, task);
      }
    },
    _push: function(promise, task) {
      this.taskList.push({
        promise: promise,
        task: task
      });
      return promise;
    }
  };

  global.MyPromise = Promise;

})(window);

getJSON = function(url, callback) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      callback(JSON.parse(request.responseText));
    } else {
      throw "something went wrong! code:" + request.status;
    }
  };
  request.onerror = function() {
    console.log("something went wrong!");
  };
  request.send();
};

var promise = new MyPromise(function(data) {
  console.log(data);
  return 2;
});

promise.then(function(data) {
  console.log(data);
  var promise = new MyPromise(function(data) {
    return data;
  });
  setTimeout(function() {
    getJSON("test.json", function(result) {
      promise.then(function(data) {
        console.log(data.info.name);
      });
      promise.resolve(result);
    });
  }, 2000);
  return promise;
}).then(function(data) {
  console.log("end");
});

promise.resolve("start");