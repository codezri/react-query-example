import React, { useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
  useMutation } from '@tanstack/react-query';
import axios from 'axios';

import './App.css';

function fetcher(url) {
  return axios.get(url).then(res => res.data);
}

async function addProduct(product) {
  let response = await axios.post('/products', product);
  return response.data;
}

function useProducts() {
  const { data, isLoading, error } = useQuery(['products'], () => fetcher('/products'));
  return {
    products: data,
    isLoading,
    isError: !!error
  };
}

function Products() {
  const { products, isLoading, isError } = useProducts();

  if(isError)
    return (
      <div>Unable to fetch products.</div>
    );

  if(isLoading)
    return (
      <div>Loading products...</div>
    );

  return (
    products.map((product) => (
      <div key={product.id} className="product-item">
        <div>{product.name}</div>
        <div>${product.price}</div>
      </div>
    ))
  );
}

function AddProduct({ goToList }) {
  const { products } = useProducts();
  const queryClient = useQueryClient();
  const mutation = useMutation((product) => addProduct(product), {
    onMutate: async (product) => {
      await queryClient.cancelQueries(['products']);

      const previousValue = queryClient.getQueryData(['products']);
      queryClient.setQueryData(['products'], (old) => [...old, product]);
      return previousValue;
    },
    onError: (err, variables, previousValue) =>
      queryClient.setQueryData(['products'], previousValue),
    onSettled: () => queryClient.invalidateQueries(['products'])
  });

  const [product, setProduct] = useState({
    id: products ? products.length + 1 : 0,
    name: '',
    price: null
  });
  const [disabled, setDisabled] = useState(true);

  async function handleAdd() {
    setTimeout(goToList);
    mutation.mutate(product);
  }

  function handleFieldUpdate(e) {
    const element = e.target;
    const value = element.type === 'number' ? parseInt(element.value) : element.value;
    const nextProduct = {...product, [element.name]: value};

    setProduct(nextProduct);
    setDisabled(!nextProduct.name || !nextProduct.price);
  }

  return(
    <div className="product-form">
      <input
        type="text"
        name="name"
        placeholder="Name"
        autoFocus
        onChange={handleFieldUpdate}/>
      <input
        type="number"
        name="price"
        min="1"
        placeholder="Price"
        onChange={handleFieldUpdate}/>
      <button onClick={handleAdd} disabled={disabled}>Add</button>
    </div>
  );
}

const queryClient = new QueryClient();

function App() {
  const [ mode, setMode ] = useState('list');
  return (
    <QueryClientProvider client={queryClient}>
      <div className="menu-bar">
        <div onClick={() => { setMode('list') }}
            className={mode === 'list' ? 'selected' : ''}>All products</div>
        <div onClick={() => { setMode('add') }}
            className={mode === 'add' ? 'selected' : ''}>Add product</div>
      </div>
      <div className="wrapper">
        { mode === 'list' ? <Products/> :
            <AddProduct goToList={() => setMode('list')}/> }
      </div>
    </QueryClientProvider>
  );
}

export default App;
