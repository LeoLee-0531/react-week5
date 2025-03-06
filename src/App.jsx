import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Modal } from "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";

const BASE_URL = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState([]);

  const [cart, setcart] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState(null);

  useEffect(() => {
    const getProducts = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/${API_PATH}/products`);
        setProducts(res.data.products);
      } catch (error) {
        alert("取得產品失敗");
      } finally {
        setIsLoading(false);
      }
    };
    getProducts();
    getCartItem();
  }, []);

  const productModalRef = useRef(null);
  useEffect(() => {
    new Modal(productModalRef.current, { backdrop: false });
  }, []);

  const openModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.show();
  };

  const closeModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.hide();
  };

  const handleSeeMore = (product) => {
    setTempProduct(product);
    openModal();
  };

  const [qtySelect, setQtySelect] = useState(1);

  const getCartItem = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/${API_PATH}/cart`);
      setcart(res.data.data.carts);
    } catch (error) {
      alert("取得購物車物品錯誤");
    }
  };

  const addCartItem = async (product_id, qty) => {
    setLoadingProductId(product_id);
    try {
      await axios.post(`${BASE_URL}/${API_PATH}/cart`, {
        data: {
          product_id: product_id,
          qty: Number(qty),
        },
      });
      await getCartItem();
    } catch (error) {
      alert("加入購物車失敗");
    } finally {
      setLoadingProductId(null);
      closeModal();
    }
  };

  const deletCartItem = async (cartItem_id) => {
    setIsLoading(true);
    try {
      await axios.delete(`${BASE_URL}/${API_PATH}/cart/${cartItem_id}`);
      getCartItem();
    } catch (error) {
      alert("刪除購物車物品失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (cartItem_id, product_id, qty) => {
    setIsLoading(true);
    try {
      await axios.put(`${BASE_URL}/${API_PATH}/cart/${cartItem_id}`, {
        data: {
          product_id,
          qty,
        },
      });
      await getCartItem();
    } catch (error) {
      alert("修改購物車物品數量錯誤");
    } finally {
      setIsLoading(false);
    }
  };

  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const calculateTotalPrice = () => {
      const res = cart.reduce((sum, cartItem) => sum + cartItem.final_total, 0);
      setTotalPrice(res);
    };
    calculateTotalPrice();
  }, [cart]);

  const deletCart = async () => {
    setIsLoading(true);
    try {
      await axios.delete(`${BASE_URL}/${API_PATH}/carts`);
      await getCartItem();
    } catch (error) {
      alert("清空購物車失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      if (!cart || cart.length === 0) {
        alert("購物車內無商品，請先加入商品再送出訂單");
        return;
      }

      await axios.post(`${BASE_URL}/${API_PATH}/order`, {
        data: {
          user: {
            name: data.name,
            email: data.email,
            tel: data.tel,
            address: data.address,
          },
          message: data.message,
        },
      });

      await getCartItem();
      reset();
    } catch (error) {
      alert("訂單送出錯誤");
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="container">
      <div className="mt-4">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>圖片</th>
              <th>商品名稱</th>
              <th>價格</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td style={{ width: "200px" }}>
                  <img
                    className="img-fluid"
                    src={product.imageUrl}
                    alt={product.title}
                  />
                </td>
                <td>{product.title}</td>
                <td>
                  <del className="h6">原價 {product.origin_price} 元</del>
                  <div className="h5">特價 {product.origin_price}元</div>
                </td>
                <td>
                  <div className="btn-group btn-group-sm">
                    <button
                      onClick={() => handleSeeMore(product)}
                      type="button"
                      className="btn btn-outline-secondary"
                    >
                      查看更多
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addCartItem(product.id, 1);
                      }}
                      className="btn btn-outline-danger"
                      disabled={loadingProductId === product.id}
                    >
                      {loadingProductId === product.id ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-1"
                            role="status"
                            aria-hidden="true"
                          ></span>
                        </>
                      ) : (
                        "加到購物車"
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          ref={productModalRef}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          className="modal fade"
          id="productModal"
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title fs-5">
                  產品名稱：{tempProduct.title}
                </h2>
                <button
                  onClick={closeModal}
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <img
                  src={tempProduct.imageUrl}
                  alt={tempProduct.title}
                  className="img-fluid"
                />
                <p>內容：{tempProduct.content}</p>
                <p>描述：{tempProduct.description}</p>
                <p>
                  價錢：{tempProduct.price}{" "}
                  <del>{tempProduct.origin_price}</del> 元
                </p>
                <div className="input-group align-items-center">
                  <label htmlFor="qtySelect">數量：</label>
                  <select
                    value={qtySelect}
                    onChange={(e) => setQtySelect(e.target.value)}
                    id="qtySelect"
                    className="form-select"
                  >
                    {Array.from({ length: 10 }).map((_, index) => (
                      <option key={index} value={index + 1}>
                        {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    addCartItem(tempProduct.id, qtySelect);
                  }}
                  className="btn btn-primary"
                  disabled={loadingProductId === tempProduct.id}
                >
                  {loadingProductId === tempProduct.id ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    </>
                  ) : (
                    "加入購物車"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {cart.length > 0 && (
          <>
            <div className="text-end py-3">
              <button
                onClick={deletCart}
                className="btn btn-outline-danger"
                type="button"
              >
                清空購物車
              </button>
            </div>

            <table className="table align-middle">
              <thead>
                <tr>
                  <th></th>
                  <th>品名</th>
                  <th style={{ width: "150px" }}>數量/單位</th>
                  <th className="text-end">單價</th>
                </tr>
              </thead>

              <tbody>
                {cart?.map((cartItem) => (
                  <tr key={cartItem.id}>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          deletCartItem(cartItem.id);
                        }}
                      >
                        x
                      </button>
                    </td>
                    <td>{cartItem.product.title}</td>
                    <td style={{ width: "150px" }}>
                      <div className="d-flex align-items-center">
                        <div className="btn-group me-2" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-dark btn-sm"
                            onClick={() => {
                              cartItem.qty == 1
                                ? deletCartItem(cartItem.id)
                                : updateCartItem(
                                    cartItem.id,
                                    cartItem.product.id,
                                    cartItem.qty - 1
                                  );
                            }}
                          >
                            -
                          </button>
                          <span
                            className="btn border border-dark"
                            style={{ width: "50px", cursor: "auto" }}
                          >
                            {cartItem.qty}
                          </span>
                          <button
                            type="button"
                            className="btn btn-outline-dark btn-sm"
                            onClick={() => {
                              updateCartItem(
                                cartItem.id,
                                cartItem.product.id,
                                cartItem.qty + 1
                              );
                            }}
                          >
                            +
                          </button>
                        </div>
                        <span className="input-group-text bg-transparent border-0">
                          {cartItem.product.unit}
                        </span>
                      </div>
                    </td>
                    <td className="text-end">{cartItem.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-end">
                    總計：{totalPrice}
                  </td>
                  <td className="text-end" style={{ width: "130px" }}></td>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </div>

      <div className="my-5 row justify-content-center">
        <form onSubmit={onSubmit} className="col-md-6">
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`form-control ${errors.email && "is-invalid"}`}
              placeholder="請輸入 Email"
              {...register("email", {
                required: "Email 欄位必填",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Email 格式錯誤",
                },
              })}
            />

            {errors.email && (
              <p className="text-danger my-2">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              收件人姓名
            </label>
            <input
              id="name"
              className={`form-control ${errors.name && "is-invalid"}`}
              placeholder="請輸入姓名"
              {...register("name", {
                required: "收件人姓名為必填",
              })}
            />

            {errors.name && (
              <p className="text-danger my-2">{errors.name.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="tel" className="form-label">
              收件人電話
            </label>
            <input
              id="tel"
              type="text"
              className={`form-control ${errors.tel && "is-invalid"}`}
              placeholder="請輸入電話"
              {...register("tel", {
                required: "收件人電話為必填",
                pattern: {
                  value: /^(0[2-8]\d{7}|09\d{8})$/,
                  message: "電話格式錯誤",
                },
              })}
            />

            {errors.tel && (
              <p className="text-danger my-2">{errors.tel.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="address" className="form-label">
              收件人地址
            </label>
            <input
              id="address"
              type="text"
              className={`form-control ${errors.address && "is-invalid"}`}
              placeholder="請輸入地址"
              {...register("address", {
                required: "收件人地址為必填",
              })}
            />

            {errors.tel && (
              <p className="text-danger my-2">{errors.address.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="message" className="form-label">
              留言
            </label>
            <textarea
              id="message"
              className="form-control"
              cols="30"
              rows="10"
              {...register("message")}
            ></textarea>
          </div>
          <div className="text-end">
            <button
              type="submit"
              className="btn btn-danger"
              disabled={cart.length === 0}
            >
              送出訂單
            </button>
          </div>
        </form>
      </div>

      {isLoading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            background:
              "linear-gradient(rgba(255,255,255,0.8), rgba(235,235,235,0.9))",
            backdropFilter: "blur(5px)",
            zIndex: 999,
          }}
        >
          <div className="text-center">
            <div className="spinner-grow text-dark mx-1" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div
              className="spinner-grow text-dark mx-1"
              role="status"
              style={{ animationDelay: "0.2s" }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <div
              className="spinner-grow text-dark mx-1"
              role="status"
              style={{ animationDelay: "0.4s" }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <h4 className="mt-3 fw-light">載入中...</h4>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
