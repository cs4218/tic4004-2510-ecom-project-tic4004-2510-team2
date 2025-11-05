import React from 'react';
import { render, fireEvent, waitFor, screen, act, within } from '@testing-library/react';
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

  it('should show server error when getAllCategory fails with response', async () => {
    axios.get.mockImplementation(() => {
      return Promise.reject({
        response: {
          status: 500,
          data: { message: 'Error while getting all categories' }
        }
      });
    });

    render(
      <MemoryRouter initialEntries={["/admin/create-category"]}>
        <Routes>
          <Route path="/admin/create-category" element={<CreateCategory />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error while getting all categories'));
  });

  it('should allow typing category name', async () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/admin/create-category"]}>
        <Routes>
          <Route path="/admin/create-category" element={<CreateCategory />} />
        </Routes>
      </MemoryRouter>
    );

    const input = getByPlaceholderText('Enter new category');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'NewCat' } });
    });

    expect(input.value).toBe('NewCat');
  });

  it('should create category successfully and refresh list', async () => {
    const uniqueCategory = `category_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    axios.post.mockResolvedValueOnce({
      status: 201,
      data: {
        success: true,
        message: 'Category created successfully',
        category: [{ _id: 'c1', name: uniqueCategory }]
      }
    });
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [{ _id: 'c1', name: uniqueCategory }] } });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={["/admin/create-category"]}>
        <Routes>
          <Route path="/admin/create-category" element={<CreateCategory />} />
        </Routes>
      </MemoryRouter>
    );

    const input = getByPlaceholderText('Enter new category');

    await act(async () => {
      fireEvent.change(input, { target: { value: uniqueCategory } });
      fireEvent.click(getByText('Submit'));
    });

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Category created successfully');
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

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Book1' } });
      fireEvent.click(getByText('Submit'));
    });

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Category already exists');
  });

  it('should update category successfully', async () => {
    const initialCategory = { _id: 'c1', name: 'Electronics' };
    axios.get.mockResolvedValue({ data: { success: true, message: "All categories listed", category: [initialCategory] } });
    axios.put.mockResolvedValueOnce({ data: { success: true, message: 'Category updated successfully', category: [{ _id: 'c1', name: 'Updated Electronics' }] } });
    axios.get.mockResolvedValueOnce({ data: { success: true, message: "All categories listed", category: [{ _id: 'c1', name: 'Updated Electronics' }] } });

    render(
      <MemoryRouter initialEntries={["/admin/create-category"]}>
        <Routes>
          <Route path="/admin/create-category" element={<CreateCategory />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    const editButtons = await screen.findAllByText('Edit');

    await act(async () => {
      fireEvent.click(editButtons[0]);
    });

    const inputs = await screen.findAllByPlaceholderText('Enter new category');
    const modalInput = inputs[1];

    await act(async () => {
      fireEvent.change(modalInput, { target: { value: 'Updated Electronics' } });
    });

    const submitButtons = await screen.findAllByText('Submit');

    await act(async () => {
      fireEvent.click(submitButtons[1]);
    });

    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith('/api/v1/category/update-category/c1', { name: 'Updated Electronics' })
    );
    expect(toast.success).toHaveBeenCalledWith('Category updated successfully');
    await waitFor(() => expect(screen.getByText('Updated Electronics')).toBeInTheDocument());
  });

  it('should delete category successfully', async () => {
    const initialCategory = { _id: 'c1', name: 'Electronics' };
    let afterDelete = false;

    axios.get.mockImplementation(() =>
      Promise.resolve({ data: { success: true, category: afterDelete ? [] : [initialCategory] } })
    );
    axios.delete.mockImplementationOnce(() => {
      afterDelete = true;
      return Promise.resolve({ data: { success: true, message: 'Category deleted successfully' } });
    });

    render(
      <MemoryRouter initialEntries={["/admin/create-category"]}>
        <Routes>
          <Route path="/admin/create-category" element={<CreateCategory />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    const deleteButtons = await screen.findAllByText('Delete');

    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });

    await waitFor(() => expect(axios.delete).toHaveBeenCalledWith('/api/v1/category/delete-category/c1'));
    expect(toast.success).toHaveBeenCalledWith('Category deleted successfully');

    const table = screen.getByRole('table');
    await waitFor(() => expect(within(table).queryByText('Electronics')).not.toBeInTheDocument());
  });

  it('should show error if input is empty', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Category name is required' }
      }
    });
    const { getByText } = render(
      <MemoryRouter initialEntries={["/admin/create-category"]}>
        <Routes>
          <Route path="/admin/create-category" element={<CreateCategory />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      fireEvent.click(getByText('Submit'));
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Category name is required'));
  });

  it('should show network error on create category failure', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Error'));


    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={["/admin/create-category"]}>
        <Routes>
          <Route path="/admin/create-category" element={<CreateCategory />} />
        </Routes>
      </MemoryRouter>
    );

    const input = getByPlaceholderText('Enter new category');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'TestCat' } });
      fireEvent.click(getByText('Submit'));
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Network Error'));
  });

  it('should show `Something went wrong on server` on error code 500 during create category failure', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        status: 500
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

    await act(async () => {
      fireEvent.change(input, { target: { value: 'TestCat' } });
      fireEvent.click(getByText('Submit'));
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong on the server'));
  });
});
