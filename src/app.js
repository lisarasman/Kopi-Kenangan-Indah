document.addEventListener("alpine:init", () => {
  Alpine.store("products", {
    items: [
      { id: 1, img: "1.jpg", name: "Robusta Brazil", price: "Rp 20.000" },
      { id: 2, img: "2.jpg", name: "Arabica Blend", price: "Rp 25.000" },
      { id: 3, img: "3.jpg", name: "Primo Passo", price: "Rp 30.000" },
      { id: 4, img: "4.jpg", name: "Aceh Gayo", price: "Rp 35.000" },
      { id: 5, img: "5.jpg", name: "Sumatra Mandheling", price: "Rp 40.000" },
    ],
  });

  // Komponen Produk (digunakan untuk tampil di section produk unggulan)
  Alpine.data("products", () => ({
    items: Alpine.store("products").items,
  }));

  // Store untuk Keranjang Belanja
  Alpine.store("cart", {
    items: [],
    total: 0,
    quantity: 0,

    add(id) {
      const product = Alpine.store("products").items.find(
        (item) => item.id === id
      );
      if (!product) return;

      // Simpan format harga asli dan nilai numerik
      const priceNumber = parseInt(product.price.replace(/[^\d]/g, ""));
      const cartItem = this.items.find((item) => item.id === id);

      if (!cartItem) {
        this.items.push({
          ...product,
          priceNumber: priceNumber,
          price: product.price,
          quantity: 1,
          total: priceNumber,
        });
        this.quantity++;
        this.total += priceNumber;
      } else {
        this.items = this.items.map((item) => {
          if (item.id !== id) return item;

          item.quantity++;
          item.total = item.priceNumber * item.quantity;
          this.quantity++;
          this.total += item.priceNumber;
          return item;
        });
      }
    },

    increase(index) {
      const item = this.items[index];
      item.quantity++;
      item.total = item.priceNumber * item.quantity;
      this.quantity++;
      this.total += item.priceNumber;
    },

    decrease(index) {
      const item = this.items[index];
      if (item.quantity > 1) {
        item.quantity--;
        item.total = item.priceNumber * item.quantity;
        this.quantity--;
        this.total -= item.priceNumber;
      } else {
        this.quantity -= item.quantity;
        this.total -= item.total;
        this.items.splice(index, 1);
      }
    },
    remove(id) {
      // ambil item yang mau diremove berdasarkan id nya
      const cartItem = this.items.find((item) => item.id === id);

      // jika item lebih dari 1
      if (cartItem.quantity > 1) {
        // telusuri 1 1
        this.items = this.items.map((item) => {
          // jika bukan barang yang diklik
          if (item.id !== id) {
            return item;
          } else {
            item.quantity--;
            item.total = item.priceNumber * item.quantity;
            this.quantity--;
            this.total -= item.priceNumber;
            return item;
          }
        });
      } else if (cartItem.quantity === 1) {
        // jika barangnya sisa 1
        this.items = this.items.filter((item) => item.id !== id);
        this.quantity--;
        this.total -= cartItem.priceNumber;
      }
    },
  });
});

// Form Validation
const checkoutButton = document.querySelector("#checkout-button");
const form = document.querySelector("#checkoutForm");

checkoutButton.disabled = true;

form.addEventListener("input", function () {
  const name = form.querySelector("#name").value.trim();
  const email = form.querySelector("#email").value.trim();
  const phone = form.querySelector("#phone").value.trim();

  const isFormFilled = name !== "" && email !== "" && phone !== "";

  checkoutButton.disabled = !isFormFilled;
  checkoutButton.classList.toggle("disabled", !isFormFilled);
});

// Kirim data ketika tombol checkout diklik
checkoutButton.addEventListener(`click`, async function (e) {
  e.preventDefault();
  const formData = new FormData(form);
  const data = new URLSearchParams(formData);
  const objData = Object.fromEntries(data);
  // const message = formatMessage(objData);
  // window.open(`http://wa.me/6282298238146?text=` + encodeURIComponent(message));

  // minta transaction token menggunakan ajax / fetch
  try {
    const response = await fetch("php/placeorder.php", {
      method: "POST",
      body: data,
    });
    const token = await response.text();
    // console.log(token);
    window.snap.pay(token);
  } catch (err) {
    console.log(err.message);
  }
});

// format pesan whatsapp
const formatMessage = (obj) => {
  return `Data Customer
  Nama: ${obj.name}
  Email: ${obj.email}
  No HP: ${obj.phone}
  Data Pesanan 
  ${JSON.parse(obj.items).map(
    (item) => `${item.name} (${item.quantity} x ${rupiah(item.total)}) /n`
  )}
  TOTAL: ${rupiah(obj.total)}
  Terima kasih.`;
};

// konversi ke format Rupiah
rupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};
