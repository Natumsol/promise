/*
	new Promise(function(resolve, reject));
	promise.then(function(){}, function(){})
 */
(function(global) {
	var PENDING = 0,
		FULLIFIED = 1,
		REJECTED = 3; // status
	function Promise(resolver) {
		this.status = PENDING;
		this.value = null;
		this.tasks = [];
		this._doPromise(resolver);
	}

	Promise.prototype = {
		constructor: Promise,
		_doPromise: function(resolver) {// 用于在初始化函数内部启动任务队列。
			var called = false,
				self = this;
			try {
				resolver(function(value) {
					if (!called) {
						called = !called;
						self.resolve(value);
					}
				}, function(value) {
					if (!called) {
						called = !called;
						self.reject(value);
					}
				});

			} catch (e) {
				if (!called) {
					called = !called;
					self.reject(e);
				}
			}
		}, 
		resolve: function(value) { // 用于手动启动队列
			try {
				if (this === value) {
					throw new TypeError("Promise connot be resolved by itself.");
				} else {
					value && value.then && this._doPromise(value.then);
				}
				this.status = FULLIFIED;
				this.value = value;
				this._dequeue();
			} catch (e) {
				this.reject(e);
			}
		},
		reject: function(reason) { // 手动
			this.status = REJECTED;
			this.value = reason;
			this._dequeue();
		},
		_dequeue: function() { // 处理队列中的任务
			var task;
			while (this.tasks.length) {
				task = this.tasks.shift();
				this._handler(task.promise, task.onFulfilled, task.onRejected);
			}
		},
		_handler: function(promise, onFulfilled, onRejected) {
			var callback = this.status == FULLIFIED ? onFulfilled : onRejected;
			if (typeof callback == 'function') {
				try {
					promise.resolve(callback(this.value));
				} catch (e) {
					promise.reject(e);
				}
				return;
			}
			this.status == FULLIFIED ? this.resolve(this.value) : this.reject(this.value);
		},
		then: function(onFulfilled, onRejected) {
			var promise = new Promise(function(){});
			if (this.status == PENDING) { // 如果当前任务状态为pending, 也就是还为开始执行任务，那么将此任务添加到任务队列
				this.tasks.push({
					promise: promise,
					onFulfilled: onFulfilled,
					onRejected: onRejected
				});
			} else {// 如果当前任务状态为fullfied 或 rejected , 那么立即执行此任务。
				this._handler(promise, onFulfilled, onRejected);
			}

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

var p = new MyPromise(function(resolve, reject) {
	resolve(1);
}).then(function(data) {
	console.log(data);
	var promise = new MyPromise(function(){});
	getJSON("test.json", function(data){
		promise.then(function(data) {
			console.log(data.info);
		});
		promise.resolve(data);
	});
	return promise;
})