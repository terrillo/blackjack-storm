if (document.getElementById("view--auth") !== null) {
	var viewAuth = new Vue({
		el: "#view--auth",
		data: {
			username: "",
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
		watch: {
			info: function () {
				if (this.info !== null && document.getElementById("view--gameboard") == null) {
					location.href = "/play-now";
				}

				if (this.info == null && document.getElementById("view--gameboard") !== null) {
					location.href = "/";
				}
			},
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
						var user = firebase.auth().currentUser;
						user.updateProfile({
							displayName: this.username,
						});
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
}
