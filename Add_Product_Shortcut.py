import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import requests
import os
import certifi

BASE_URL = "https://vs-fashion.com/api"
ADMIN_EMAIL = "vsfashiiiion@gmail.com"
ADMIN_PASSWORD = "vs@54321"

class VSProductUploader:
    def __init__(self, root):
        self.root = root
        self.root.title("VS Fashion - Quick Product Uploader")
        self.root.geometry("600x650")
        self.root.configure(padx=20, pady=20)
        
        self.token = None
        self.collections = []
        self.categories = []
        self.image_paths = []

        # Login and fetch data immediately
        self.status_var = tk.StringVar(value="Connecting to website...")
        
        # UI Setup
        self.setup_ui()
        
        # Start connection process
        self.root.after(100, self.connect_to_server)

    def connect_to_server(self):
        try:
            # Login
            res = requests.post(f"{BASE_URL}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, verify=certifi.where())
            if res.status_code == 200:
                self.token = res.json()["token"]
                self.fetch_metadata()
                self.status_var.set("Connected to vs-fashion.com!")
                self.upload_btn.config(state="normal")
            else:
                self.status_var.set("Login failed. Check credentials/internet.")
                messagebox.showerror("Error", "Failed to login to the website.")
        except Exception as e:
            self.status_var.set("Connection error.")
            messagebox.showerror("Error", f"Could not connect: {str(e)}")

    def fetch_metadata(self):
        try:
            col_res = requests.get(f"{BASE_URL}/collections", verify=certifi.where())
            cat_res = requests.get(f"{BASE_URL}/categories", verify=certifi.where())
            
            if col_res.status_code == 200:
                self.collections = col_res.json()
                self.col_combo['values'] = [c["name"] for c in self.collections]
            
            if cat_res.status_code == 200:
                self.categories = cat_res.json()
        except Exception as e:
            print("Failed to fetch metadata:", e)

    def on_collection_select(self, event):
        selected_col_name = self.col_var.get()
        selected_col = next((c for c in self.collections if c["name"] == selected_col_name), None)
        
        if selected_col:
            filtered_cats = [c["name"] for c in self.categories if c["collection_id"] == selected_col["id"]]
            self.cat_combo['values'] = filtered_cats
            self.cat_var.set("")

    def select_images(self):
        filetypes = (('Image files', '*.jpg *.jpeg *.png *.webp'), ('All files', '*.*'))
        paths = filedialog.askopenfilenames(
            title='Select Product Images (up to 4)',
            filetypes=filetypes
        )
        if paths:
            if len(paths) > 4:
                messagebox.showwarning("Too many images", "Only the first 4 images will be uploaded.")
                self.image_paths = list(paths)[:4]
            else:
                self.image_paths = list(paths)
            self.img_label.config(text=f"{len(self.image_paths)} image(s) selected")

    def upload_product(self):
        if not self.token:
            messagebox.showerror("Error", "Not logged in to server.")
            return
            
        name = self.name_var.get()
        col_name = self.col_var.get()
        cat_name = self.cat_var.get()
        colors = self.colors_var.get()
        sizes = self.sizes_var.get()
        price = self.price_var.get()
        qty = self.qty_var.get()
        
        if not all([name, col_name, cat_name, colors, sizes, price, qty]):
            messagebox.showerror("Validation Error", "Please fill all required fields")
            return
            
        if not self.image_paths:
            messagebox.showerror("Validation Error", "Please select at least 1 image")
            return

        selected_col = next((c for c in self.collections if c["name"] == col_name), None)
        selected_cat = next((c for c in self.categories if c["name"] == cat_name), None)

        if not selected_col or not selected_cat:
            messagebox.showerror("Error", "Invalid collection or category")
            return

        self.status_var.set("Uploading product...")
        self.root.update()

        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            data = {
                "name": name,
                "collection_id": selected_col["id"],
                "category_id": selected_cat["id"],
                "category": selected_cat["name"],
                "colors": colors,
                "sizes": sizes,
                "size_chart": self.size_chart_var.get(),
                "quantity": qty,
                "price": price,
                "is_trending": str(self.trending_var.get()).lower()
            }
            
            files = []
            file_handles = []
            for path in self.image_paths:
                f = open(path, 'rb')
                file_handles.append(f)
                files.append(('images', (os.path.basename(path), f, 'image/jpeg')))
                
            res = requests.post(f"{BASE_URL}/admin/products", headers=headers, data=data, files=files, verify=certifi.where())
            
            # Close file handles
            for f in file_handles:
                f.close()
                
            if res.status_code in [200, 201]:
                messagebox.showinfo("Success", "Product added successfully!")
                self.reset_form()
            else:
                messagebox.showerror("Upload Failed", f"Server error: {res.text}")
                
            self.status_var.set("Connected to vs-fashion.com!")
            
        except Exception as e:
            self.status_var.set("Upload error")
            messagebox.showerror("Error", f"Failed to upload: {str(e)}")

    def reset_form(self):
        self.name_var.set("")
        self.colors_var.set("")
        self.sizes_var.set("")
        self.size_chart_var.set("")
        self.price_var.set("")
        self.qty_var.set("")
        self.trending_var.set(False)
        self.image_paths = []
        self.img_label.config(text="No images selected")

    def setup_ui(self):
        # Variables
        self.name_var = tk.StringVar()
        self.col_var = tk.StringVar()
        self.cat_var = tk.StringVar()
        self.colors_var = tk.StringVar()
        self.sizes_var = tk.StringVar()
        self.size_chart_var = tk.StringVar()
        self.price_var = tk.StringVar()
        self.qty_var = tk.StringVar()
        self.trending_var = tk.BooleanVar()

        # Frame definition helper
        def make_field(parent, label_text, widget, row):
            tk.Label(parent, text=label_text, font=("Arial", 10, "bold")).grid(row=row, column=0, sticky="w", pady=5)
            widget.grid(row=row, column=1, sticky="ew", pady=5, padx=10)

        main_frame = tk.Frame(self.root)
        main_frame.pack(fill="both", expand=True)
        main_frame.columnconfigure(1, weight=1)

        # Fields
        make_field(main_frame, "Product Name *", tk.Entry(main_frame, textvariable=self.name_var), 0)
        
        self.col_combo = ttk.Combobox(main_frame, textvariable=self.col_var, state="readonly")
        self.col_combo.bind("<<ComboboxSelected>>", self.on_collection_select)
        make_field(main_frame, "Collection *", self.col_combo, 1)

        self.cat_combo = ttk.Combobox(main_frame, textvariable=self.cat_var, state="readonly")
        make_field(main_frame, "Category *", self.cat_combo, 2)

        make_field(main_frame, "Colors (comma-separated) *", tk.Entry(main_frame, textvariable=self.colors_var), 3)
        make_field(main_frame, "Sizes (comma-separated) *", tk.Entry(main_frame, textvariable=self.sizes_var), 4)
        make_field(main_frame, "Size Chart (optional)", tk.Entry(main_frame, textvariable=self.size_chart_var), 5)
        make_field(main_frame, "Quantity *", tk.Entry(main_frame, textvariable=self.qty_var), 6)
        make_field(main_frame, "Price (₹) *", tk.Entry(main_frame, textvariable=self.price_var), 7)

        tk.Checkbutton(main_frame, text="Show in Trending", variable=self.trending_var).grid(row=8, column=1, sticky="w", pady=5, padx=5)

        # Image Selection
        img_frame = tk.Frame(main_frame)
        img_frame.grid(row=9, column=1, sticky="w", pady=10, padx=5)
        tk.Button(img_frame, text="Select Images (Max 4) *", command=self.select_images).pack(side="left")
        self.img_label = tk.Label(img_frame, text="No images selected", textcolor="grey")
        self.img_label.pack(side="left", padx=10)
        tk.Label(main_frame, text="Images *", font=("Arial", 10, "bold")).grid(row=9, column=0, sticky="w", pady=5)

        # Upload Button
        self.upload_btn = tk.Button(main_frame, text="UPLOAD PRODUCT", font=("Arial", 12, "bold"), bg="black", fg="white", 
                                    command=self.upload_product, state="disabled", height=2)
        self.upload_btn.grid(row=10, column=0, columnspan=2, sticky="ew", pady=20)

        # Status Label
        tk.Label(self.root, textvariable=self.status_var, font=("Arial", 9), fg="blue").pack(side="bottom", anchor="w")

if __name__ == "__main__":
    root = tk.Tk()
    app = VSProductUploader(root)
    root.mainloop()
