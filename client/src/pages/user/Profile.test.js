import React from 'react';
import axios from 'axios';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from './Profile';
import * as authCtx from '../../context/auth';
import { CartProvider } from '../../context/cart';
import { SearchProvider } from '../../context/search';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';

jest.mock('axios');
jest.mock('../../hooks/useCategory', () => jest.fn(() => []));

describe('Profile Component', () => {
  const setAuth = jest.fn();

  beforeEach(() => {
    jest.spyOn(authCtx, 'useAuth').mockReturnValue([
      {
        user: {
          _id: 'user-id',
          name: 'Old Name',
          email: 'old@email.com',
          password: 'oldpassword',
          phone: '12345678',
          address: 'Old Address',
        },
        token: 'test-token',
      },
      setAuth,
    ]);
    jest.spyOn(toast, 'success').mockImplementation(() => {});
    jest.spyOn(toast, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('password too short shows error toast', async () => {
  const setAuth = jest.fn();
    jest.spyOn(authCtx, 'useAuth').mockReturnValue([
      {
        user: {
          _id: 'user-id',
          name: 'Old Name',
          email: 'old@email.com',
          password: 'oldpassword',
          phone: '12345678',
          address: 'Old Address',
        },
        token: 'test-token',
      },
      setAuth,
    ]);
    jest.spyOn(toast, 'success').mockImplementation(() => {});
    jest.spyOn(toast, 'error').mockImplementation(() => {});

    axios.put.mockResolvedValueOnce({
      data: { error: 'Password must be at least 6 characters long' },
    });

    render(
      <MemoryRouter>
        <SearchProvider>
          <CartProvider>
            <Profile />
          </CartProvider>
        </SearchProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter Your Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    // assert error message
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });

    // assert error toast called
    expect(toast.error).toHaveBeenCalledWith('Password must be at least 6 characters long');
    expect(toast.success).not.toHaveBeenCalled();
  });

  test('invalid user shows error toast', async () => {
    const setAuth = jest.fn();
    jest.spyOn(authCtx, 'useAuth').mockReturnValue([
      {
        user: {
          _id: 'invalid-user-id',
          name: 'Old Name',
          email: 'old@email.com',
          password: 'oldpassword',
          phone: '12345678',
          address: 'Old Address',
        },
        token: 'test-token',
      },
      setAuth,
    ]);
    jest.spyOn(toast, 'success').mockImplementation(() => {});
    jest.spyOn(toast, 'error').mockImplementation(() => {});

    axios.put.mockResolvedValueOnce({
      data: { error: 'Something went wrong' },
    });

    render(
      <MemoryRouter>
        <SearchProvider>
          <CartProvider>
            <Profile />
          </CartProvider>
        </SearchProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter Your Email/i), { target: { value: 'new@email.com' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    // assert error message
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });

    // assert error toast called
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    expect(toast.success).not.toHaveBeenCalled();
  });

  test('field fallback behaviour on partial updates', async () => {
    const setAuth = jest.fn();
    jest.spyOn(authCtx, 'useAuth').mockReturnValue([
      {
        user: {
          _id: 'user-id',
          name: 'Old Name',
          email: 'old@email.com',
          password: 'oldpassword',
          phone: '12345678',
          address: 'Old Address',
        },
        token: 'test-token',
      },
      setAuth,
    ]);
    jest.spyOn(toast, 'success').mockImplementation(() => {});
    jest.spyOn(toast, 'error').mockImplementation(() => {});

    axios.put.mockResolvedValueOnce({
      data: {
        updatedUser: {
          _id: 'user-id',
          name: 'Old Name',
          email: 'old@email.com',
          password: 'oldpassword',
          phone: '12345678',
          address: 'Old Address',
        },
        token: 'test-token',
      },
      setAuth,
    });

    render(
      <MemoryRouter>
        <SearchProvider>
          <CartProvider>
            <Profile />
          </CartProvider>
        </SearchProvider>
      </MemoryRouter>
    );

    // only change phone number
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Phone/i), { target: { value: '99999999' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    // assert unchanged fields are not changed
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/auth/profile',
        expect.objectContaining({
          name: 'Old Name',
          email: 'old@email.com',
          phone: '99999999',
          address: 'Old Address',
        }),
      );
    });

    // assert success toast called
    expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
  });

  test('successfully updates the user profile', async () => {
    const setAuth = jest.fn();
    jest.spyOn(authCtx, 'useAuth').mockReturnValue([
      {
        user: {
          _id: 'user-id',
          name: 'Old Name',
          email: 'old@email.com',
          password: 'oldpassword',
          phone: '12345678',
          address: 'Old Address',
        },
        token: 'test-token',
      },
      setAuth,
    ]);
    jest.spyOn(toast, 'success').mockImplementation(() => {});
    jest.spyOn(toast, 'error').mockImplementation(() => {});

    axios.put.mockResolvedValueOnce({
      data: {
        updatedUser: {
          _id: 'user-id',
          name: 'New Name',
          email: 'old@email.com',
          phone: '87654321',
          address: 'New Address',
        },
      },
    });

    render(
      <MemoryRouter>
        <SearchProvider>
          <CartProvider>
            <Profile />
          </CartProvider>
        </SearchProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter Your Name/i), { target: { value: 'New Name' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Phone/i), { target: { value: '87654321' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Address/i), { target: { value: 'New Address' } });

    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    // assert reflected changes
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/auth/profile',
        expect.objectContaining({
          name: 'New Name',
          email: 'old@email.com',
          phone: '87654321',
          address: 'New Address',
        })
      );

      // assert setAuth and success toast called
      expect(setAuth).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
    });
  });

});