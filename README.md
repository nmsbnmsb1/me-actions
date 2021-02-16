# me-actions

> execute a group of actions in order.

### Example

### Run-One

```ts
//define runtime data
let context: any = { datas: {}, errs: {} };
let act: Action = new RunOne(true)
	.addChild(
		new RunFunc(async () => {
			return new Promise((resolve: any) => {
				setTimeout(() => {
					console.log('1 done');
					resolve('1');
				}, 1500);
			});
		})
	)
	.addChild(
		new RunFunc(async () => {
			return new Promise((resolve: any) => {
				setTimeout(() => {
					console.log('2 done');
					resolve('2');
				}, 1500);
			});
		})
	)
	.start(context)
	.watchThen((result: IActionResult) => {
		console.log(result);
	});

setTimeout(() => {
	act.stop(context);
}, 1700);
```

### Run-all. Similar as Promise.all().

```ts
//define runtime data
let context: any = { datas: {}, errs: {} };
let act: Action = new RunAll(true, false)
	.addChild(
		new RunFunc(async () => {
			return new Promise((resolve: any) => {
				setTimeout(() => {
					console.log('1 done');
					resolve('1');
				}, 1500);
			});
		})
	)
	.addChild(
		new RunFunc(async () => {
			return new Promise((resolve: any) => {
				setTimeout(() => {
					console.log('2 done');
					resolve('2');
				}, 1500);
			});
		})
	)
	.start(context);

setTimeout(() => {
	act.stop(context);
}, 1700);
```

### Run mix.

```ts
//define runtime data
let context: any = { datas: {}, errs: {} };
let act: Action = new RunOne(true)
	.addChild(
		new RunFunc(async () => {
			return new Promise((resolve: any) => {
				setTimeout(() => {
					console.log('1 done');
					resolve('1');
				}, 1500);
			});
		}),
		new RunAll().addChild(
			new RunFunc(async () => {
				return new Promise((resolve: any) => {
					setTimeout(() => {
						console.log('1-1 done');
						resolve('1-1');
					}, 1500);
				});
			}),
			new RunFunc(async () => {
				return new Promise((resolve: any) => {
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
```

### Runtime data interface.

```ts
export interface IContext {
	datas?: { [index: string]: any };
	errs?: { [index: string]: any };
	[name: string]: any;
}

export interface IResult {
	action: Action;
	context?: any;
	data?: any;
	err?: any;
}
```
