// const { RunOne } = require('../lib/run-one');
// const { RunFunc } = require('../lib/run-func');
// const { RunAll } = require('../lib/run-all');

// let arr = [0, 1, 2];
// arr.splice(1, 0, 0.5);
// console.log(arr);
// return;

let context = { datas: {}, errs: {} };
let act = new RunOne(true)
	.addChild(
		new RunFunc(async () => {
			const a1 = new RunFunc(() => {
				return new Promise((resolve) => {
					setTimeout(() => {
						console.log('aaa');
						resolve(true);
					}, 2000);
				});
			});
			a1.startAsync(context);

			setTimeout(() => {
				console.log('stop');
				a1.stop();
			}, 1000);

			await a1.p();

			console.log(a1);
		}),
		new RunFunc(async () => {
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('1 done');
					resolve('1');
				}, 1500);
			});
		}),
		new RunAll().addChild(
			new RunFunc(async () => {
				return new Promise((resolve) => {
					setTimeout(() => {
						console.log('1-1 done');
						resolve('1-1');
					}, 1500);
				});
			}),
			new RunFunc(async () => {
				return new Promise((resolve) => {
					setTimeout(() => {
						console.log('1-2 done');
						resolve('1-2');
					}, 1500);
				});
			})
		)
	)
	.start(context);

setTimeout(() => {
	act.stop(context);
}, 1700);
