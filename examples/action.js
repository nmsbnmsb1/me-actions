const { Action } = require('../lib');

class TestAction extends Action {
	 async doStart() {
		let rp = this.getRP();
		setTimeout(() => {
			rp.reject('aaa');
		}, 1000);
		await rp.p;
	}
}

(async()=>{
    let p=new Promise((resolve)=>{

        let a=new TestAction();
        a.setContext({name:'test'})
        a.start()
        a.watch(()=>{
            console.log(a.getStatus())
            resolve()
        })
    })
    await p;
})()