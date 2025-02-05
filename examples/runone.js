const { RunOne, ActionForFunc } = require('../lib');

const context = { datas: {}, errs: {} };

//a1
(async () => {
	const a1 = new RunOne(1);
	a1.setName('run-one');
	a1.addChild(
		new ActionForFunc(() => {
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('a1', 1);
					resolve(1);
				}, 100);
			});
		}).setName('1')
	);
	a1.addChild(
		new ActionForFunc(async () => {
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('a2', 2);
					resolve(2);
				}, 200);
			});
		}).setName('2')
	);
	a1.addChild(
		new ActionForFunc(async () => {
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('a3', 3);
					resolve(3);
				}, 300);
			});
		}).setName('3').watch(() => {
			return new Promise((resolve) => {
				console.log('wait for 4');
				a1.addChild(
					new ActionForFunc(() => {
						return new Promise((resolve) => {
							setTimeout(() => {
								console.log('a4', 4);
								resolve(4);
							}, 4000);
						});
					}).setName('4')
				);
				resolve();
			})
		})
	);
	a1.watch(() => {
		console.log('watch finished')
	})

	// setTimeout(() => {
	// 	a1.stop();
	// 	console.log('stop');
	// }, 500);
	console.log('final', await a1.start(context));
})();
