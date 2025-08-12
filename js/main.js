function hello(r) {
    r.return(200, "Hello from njs via Docker!\n");
}

export default { hello };