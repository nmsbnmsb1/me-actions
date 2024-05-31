const { ActionForSleep } = require('../lib');

const context = { datas: {}, errs: {} };

//a1
(async () => {
	const a1 = new ActionForSleep(2000);
	setTimeout(() => {
		a1.stop();
		console.log('stop');
	}, 1000);
	await a1.start(context);
	console.log('final', a1);
})();
