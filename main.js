// DECLARACIÓN CON DOM
const productosContainer = document.getElementById("productos-container");
const carritoContainer = document.getElementById("carrito-container");
const totalCarritoElement = document.getElementById("total-carrito");
const finalizarCompraBtn = document.getElementById("finalizar-compra");
const carritoVacioMensaje = document.getElementById("carrito-vacio");

// ALMACENAMIENTO LOCAL STORAGE 
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let productosData = []; //ARRAY PRODUCTOS CARGADOS


// CARGA DE PRODUCTOS
const cargarProductos = async () => {
    try {
        const response = await fetch('data.json');
        productosData = await response.json();
        mostrarProductos();
    } catch (error) {
        console.error("Error al cargar los productos:", error);
        productosContainer.innerHTML = "<p>Error al cargar los productos.</p>";
    }
};

//MOSTRAR PRODUCTOS
const mostrarProductos = () => {
    productosContainer.innerHTML = "";
    productosData.forEach(producto => {
        const card = document.createElement("div");
        card.className = "producto-card";
        card.innerHTML = `
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion}</p>
            <img src="${producto.imagen}" alt="${producto.nombre}" width="100">
            <p>Precio: $${producto.precio.toFixed(2)}</p>
            <button class="agregar-carrito" data-id="${producto.id}">Agregar al Carrito</button>
        `;
        productosContainer.appendChild(card);
    });

    
    const botonesAgregar = document.querySelectorAll(".agregar-carrito");
    botonesAgregar.forEach(boton => {
        boton.addEventListener("click", agregarAlCarrito);
    });
};

const agregarAlCarrito = (event) => {
    const productoId = parseInt(event.target.dataset.id);
    const productoExistente = carrito.find(item => item.id === productoId);
    const producto = productosData.find(p => p.id === productoId);

    if (producto && producto.stock > 0) {
        if (productoExistente) {
            productoExistente.cantidad++;
        } else {
            carrito.push({ id: productoId, nombre: producto.nombre, precio: producto.precio, cantidad: 1 });
        }
        producto.stock--; 
        actualizarLocalStorageCarrito();
        mostrarCarrito();
        mostrarProductos();

        //SWWETALERT
        Swal.fire({
            title: '¡Producto agregado!',
            text: `${producto.nombre} se ha añadido al carrito.`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    } else if (producto && producto.stock === 0) {
        Swal.fire({
            title: '¡Agotado!',
            text: `El producto "${producto.nombre}" está agotado.`,
            icon: 'warning'
        });
    }
};

const eliminarDelCarrito = (index) => {
    
    Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas eliminar "${carrito[index].nombre}" del carrito?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const productoId = carrito[index].id;
            const productoEnData = productosData.find(p => p.id === productoId);
            if (productoEnData) {
                productoEnData.stock += carrito[index].cantidad;
            }
            carrito.splice(index, 1);
            actualizarLocalStorageCarrito();
            mostrarCarrito();
            mostrarProductos();
            Swal.fire(
                '¡Eliminado!',
                `${carrito[index]?.nombre || 'El artículo'} ha sido eliminado del carrito.`,
                'success'
            );
        }
    });
};

const actualizarCantidadCarrito = (index, nuevaCantidad) => {
    const productoId = carrito[index].id;
    const productoEnData = productosData.find(p => p.id === productoId);
    const diferencia = nuevaCantidad - carrito[index].cantidad;
//control de stock
    if (productoEnData && productoEnData.stock >= diferencia && nuevaCantidad > 0) {
        productoEnData.stock -= diferencia;
        carrito[index].cantidad = parseInt(nuevaCantidad);
        actualizarLocalStorageCarrito();
        mostrarCarrito();
        mostrarProductos();
    } else if (nuevaCantidad <= 0) {
        eliminarDelCarrito(index);
    } else {
        Swal.fire({
            title: '¡Stock insuficiente!',
            text: `No hay suficiente stock de "${carrito[index].nombre}". Stock disponible: ${productoEnData.stock + carrito[index].cantidad}`,
            icon: 'error'
        });
        mostrarCarrito(); 
    }
};

const actualizarLocalStorageCarrito = () => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
};

const mostrarCarrito = () => {
    carritoContainer.innerHTML = "";
    let total = 0;

    if (carrito.length === 0) {
        carritoVacioMensaje.style.display = "block";
    } else {
        carritoVacioMensaje.style.display = "none";
        carrito.forEach((item, index) => {
            const itemCarrito = document.createElement("div");
            itemCarrito.className = "carrito-item";
            itemCarrito.innerHTML = `
                <p>${item.nombre}</p>
                <p>Precio: $${item.precio.toFixed(2)}</p>
                <p>Cantidad: <input type="number" value="${item.cantidad}" min="1" onchange="actualizarCantidadCarrito(${index}, this.value)"></p>
                <p>Subtotal: $${(item.precio * item.cantidad).toFixed(2)}</p>
                <button class="eliminar-carrito-item" onclick="eliminarDelCarrito(${index})">Eliminar</button>
            `;
            carritoContainer.appendChild(itemCarrito);
            total += item.precio * item.cantidad;
        });
    }

    totalCarritoElement.textContent = `Total: $${total.toFixed(2)}`;
};

const finalizarCompra = () => {
    if (carrito.length > 0) {
        const resumenPedido = carrito.map(item => `- ${item.nombre} x ${item.cantidad} = $${(item.precio * item.cantidad).toFixed(2)}`).join("\n");
        const total = parseFloat(totalCarritoElement.textContent.split('$')[1]).toFixed(2);
        Swal.fire({
            title: '¡Gracias por tu compra!',
            html: `Resumen del pedido:<br>${resumenPedido}<br><br>Total: $${total}`,
            icon: 'success',
            confirmButtonText: 'Aceptar'
        }).then(() => {
            carrito = [];
            actualizarLocalStorageCarrito();
            mostrarCarrito();
            cargarProductos();
        });
    } else {
        Swal.fire({
            title: 'Carrito vacío',
            text: 'Agrega productos para finalizar la compra.',
            icon: 'info'
        });
    }
};



// EVENTO LISTENER
finalizarCompraBtn.addEventListener("click", finalizarCompra);

// ESTADO GENERAL
cargarProductos();
mostrarCarrito();