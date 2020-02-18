# bitcoin.js
Bitcoin tools implemented in ES6.

## Example Usage 

```javascript
const bitcoin = await import('https://coins.github.io/bitcoin-js/bitcoin.js')
const secret = bitcoin.PrivateKey.generate()
await secret.toAddress()
```

### Demo
```html
<h1>Bitcoin Address Generator</h1>
<div>Secret: <span id="$secret"></span></div>
<div>Address: <span id="$address"></span></div>

<script type="module">
	import { PrivateKey } from 'https://coins.github.io/bitcoin-js/bitcoin.js'
	
	const secret = PrivateKey.generate()
	secret.export().then(wif => $secret.textContent = wif) 
	secret.toAddress().then(address => $address.textContent = address)
</script>
```

... encoded in a dataurl:
```
data:text/html;base64,PHRpdGxlPkRlbW9fUHJvamVjdDwvdGl0bGU+CjxoMT5CaXRjb2luIEFkZHJlc3MgR2VuZXJhdG9yPC9oMT4KPGRpdj5TZWNyZXQ6IDxzcGFuIGlkPSIkc2VjcmV0Ij48L3NwYW4+PC9kaXY+CjxkaXY+QWRkcmVzczogPHNwYW4gaWQ9IiRhZGRyZXNzIj48L3NwYW4+PC9kaXY+Cgo8c2NyaXB0IHR5cGU9Im1vZHVsZSI+CglpbXBvcnQge1ByaXZhdGVLZXl9IGZyb20gJ2h0dHBzOi8vY29pbnMuZ2l0aHViLmlvL2JpdGNvaW4tanMvYml0Y29pbi5qcycKCQoJY29uc3Qgc2VjcmV0ID0gUHJpdmF0ZUtleS5nZW5lcmF0ZSgpCglzZWNyZXQuZXhwb3J0KCkudGhlbih3aWYgPT4gJHNlY3JldC50ZXh0Q29udGVudCA9IHdpZikgCglzZWNyZXQudG9BZGRyZXNzKCkudGhlbihhZGRyZXNzID0+ICRhZGRyZXNzLnRleHRDb250ZW50ID0gYWRkcmVzcykKPC9zY3JpcHQ+
```
