# bitcoin.js
Bitcoin data structures

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
import * as bitcoin from 'https://coins.github.io/bitcoin-js/bitcoin.js'
const secret = bitcoin.PrivateKey.generate()
secret.export().then(wif => $secret.textContent = wif) 
secret.toAddress().then(address => $address.textContent = address)
</script>
```

... encoded in a dataurl:
```
data:text/html;base64,PHRpdGxlPkJpdGNvaW4gQWRkcmVzcyBHZW5lcmF0b3I8L3RpdGxlPgo8aDE+Qml0Y29pbiBBZGRyZXNzIEdlbmVyYXRvcjwvaDE+CjxkaXY+U2VjcmV0OiA8c3BhbiBpZD0iJHNlY3JldCI+PC9zcGFuPjwvZGl2Pgo8ZGl2PkFkZHJlc3M6IDxzcGFuIGlkPSIkYWRkcmVzcyI+PC9zcGFuPjwvZGl2Pgo8c2NyaXB0IHR5cGU9Im1vZHVsZSI+CmltcG9ydCAqIGFzIGJpdGNvaW4gZnJvbSAnaHR0cHM6Ly9jb2lucy5naXRodWIuaW8vYml0Y29pbi1qcy9iaXRjb2luLmpzJwpjb25zdCBzZWNyZXQgPSBiaXRjb2luLlByaXZhdGVLZXkuZ2VuZXJhdGUoKQpzZWNyZXQuZXhwb3J0KCkudGhlbih3aWYgPT4gJHNlY3JldC50ZXh0Q29udGVudCA9IHdpZikgCnNlY3JldC50b0FkZHJlc3MoKS50aGVuKGFkZHJlc3MgPT4gJGFkZHJlc3MudGV4dENvbnRlbnQgPSBhZGRyZXNzKQo8L3NjcmlwdD4=
```
