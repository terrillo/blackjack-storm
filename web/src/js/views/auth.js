var viewAuth = new Vue({
	el: "#view--auth",
	data: {
		email: "",
		password: "",
		error: false,
		view: false,
		info: false,
	},
	created: function () {
		firebase.auth().onAuthStateChanged((user) => {
			this.info = user;
		});
	},
	methods: {
		modal: function (view) {
			this.view = view;
		},
		log_in: function () {
			firebase
				.auth()
				.signInWithEmailAndPassword(this.email, this.password)
				.then((userCredential) => {
					this.info = userCredential.user;
					this.modal(false);
				})
				.catch((error) => {
					this.error = error.message;
				});
		},
		sign_up: function () {
			firebase
				.auth()
				.createUserWithEmailAndPassword(this.email, this.password)
				.then((userCredential) => {
					this.info = userCredential.user;
					this.modal(false);
				})
				.catch((error) => {
					this.error = error.message;
				});
		},
		sign_out: function () {
			firebase.auth().signOut();
		},
	},
});
