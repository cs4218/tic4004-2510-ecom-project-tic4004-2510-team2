import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import CreateCategory from './CreateCategory';

// Mock axios and toast
jest.mock('axios');
jest.mock('react-hot-toast');

// Mock context hooks used by the app so component can render with an authenticated admin
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [{ user: { name: 'Admin', role: 1 }, token: 'admintoken' }, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

// minimal matchMedia shim for libraries that query it
window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () { },
    removeListener: function () { }
  };
};

describe('CreateCategory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('renders Manage Category heading and form input', async () => {
    let rendered;
    await act(async () => {
      rendered = render(
        <MemoryRouter initialEntries={["/admin/create-category"]}>
          <Routes>
            <Route path="/admin/create-category" element={<CreateCategory />} />
          </Routes>
        </MemoryRouter>
      );
    });
    const { getByText, getByPlaceholderText } = rendered;

    expect(getByText('Manage Category')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter new category')).toBeInTheDocument();
  });

  it('input should be initially empty', () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/admin/create-category"]}>
        <Routes>
          <Route path="/admin/create-category" element={<CreateCategory />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByPlaceholderText('Enter new category').value).toBe('');
  });

  it('should allow typing category name', () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/admin/create-category"]}>
        <Routes>
          <Route path="/admin/create-category" element={<CreateCategory />} />
        </Routes>
      </MemoryRouter>
    );

    const input = getByPlaceholderText('Enter new category');
    fireEvent.change(input, { target: { value: 'NewCat' } });
    expect(input.value).toBe('NewCat');
  });

  it('should create category successfully and refresh list', async () => {
    // Generate a unique category name
    const uniqueCategory = `category_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    axios.post.mockResolvedValueOnce({
      status: 201,
      data: {
        success: true,
        message: 'Category created successfully',
        category: [{ _id: 'c1', name: uniqueCategory }]
      }
    });
    // when component refreshes the list it will call axios.get again; return the new category
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: 'c1', name: uniqueCategory }] } });
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={["/admin/create-category"]}>
        <Routes>
          <Route path="/admin/create-category" element={<CreateCategory />} />
        </Routes>
      </MemoryRouter>
    );

    const input = getByPlaceholderText('Enter new category');
    fireEvent.change(input, { target: { value: uniqueCategory } });
    fireEvent.click(getByText('Submit'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());

    // toast.success called with backend message
    expect(toast.success).toHaveBeenCalledWith('Category created successfully');

    // after refresh, the table should contain the category name from mocked get
    await waitFor(() => expect(getByText(uniqueCategory)).toBeInTheDocument());
  });

  it('should show category already exists error', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          success: false,
          message: 'Category already exists'
        }
      }
    });
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={["/admin/create-category"]}>
        <Routes>
          <Route path="/admin/create-category" element={<CreateCategory />} />
        </Routes>
      </MemoryRouter>
    );

    const input = getByPlaceholderText('Enter new category');
    fireEvent.change(input, { target: { value: 'Book1' } });
    fireEvent.click(getByText('Submit'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());

    expect(toast.error).toHaveBeenCalledWith('Category already exists');
  });
});
