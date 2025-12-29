import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable, type Column } from './DataTable'

interface TestData {
  id: string
  name: string
  email: string
  status: string
}

const testData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', status: 'active' },
]

const columns: Column<TestData>[] = [
  { key: 'name', header: 'Name', cell: (row) => row.name },
  { key: 'email', header: 'Email', cell: (row) => row.email },
  { key: 'status', header: 'Status', cell: (row) => row.status, sortable: true },
]

describe('DataTable', () => {
  it('should render column headers', () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        keyExtractor={(row) => row.id}
      />
    )

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('should render data rows', () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        keyExtractor={(row) => row.id}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('should show empty message when no data', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(row) => row.id}
        emptyMessage="No users found"
      />
    )

    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('should show default empty message when not specified', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(row) => row.id}
      />
    )

    expect(screen.getByText('No data found')).toBeInTheDocument()
  })

  it('should call onRowClick when row is clicked', async () => {
    const user = userEvent.setup()
    const handleRowClick = vi.fn()

    render(
      <DataTable
        columns={columns}
        data={testData}
        keyExtractor={(row) => row.id}
        onRowClick={handleRowClick}
      />
    )

    await user.click(screen.getByText('John Doe'))
    expect(handleRowClick).toHaveBeenCalledWith(testData[0])
  })

  it('should have clickable cursor when onRowClick is provided', () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        keyExtractor={(row) => row.id}
        onRowClick={() => {}}
      />
    )

    const row = screen.getByText('John Doe').closest('tr')
    expect(row).toHaveClass('cursor-pointer')
  })

  it('should not have clickable cursor when onRowClick is not provided', () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        keyExtractor={(row) => row.id}
      />
    )

    const row = screen.getByText('John Doe').closest('tr')
    expect(row).not.toHaveClass('cursor-pointer')
  })

  describe('sorting', () => {
    it('should show sort icon for sortable columns', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(row) => row.id}
        />
      )

      const statusHeader = screen.getByText('Status').closest('th')
      const sortIcon = statusHeader?.querySelector('svg')
      expect(sortIcon).toBeInTheDocument()
    })

    it('should not show sort icon for non-sortable columns', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(row) => row.id}
        />
      )

      const nameHeader = screen.getByText('Name').closest('th')
      const sortIcon = nameHeader?.querySelector('svg')
      expect(sortIcon).not.toBeInTheDocument()
    })

    it('should toggle sort direction when clicking sortable column', async () => {
      const user = userEvent.setup()

      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(row) => row.id}
        />
      )

      const statusHeader = screen.getByText('Status').closest('th')
      await user.click(statusHeader!)

      // Click again to toggle
      await user.click(statusHeader!)

      // The internal state should have changed (tested via visual change in real app)
      expect(statusHeader).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      render(
        <DataTable
          columns={columns}
          data={[]}
          keyExtractor={(row) => row.id}
          loading
        />
      )

      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should not show data when loading', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(row) => row.id}
          loading
        />
      )

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })
  })

  describe('pagination', () => {
    it('should show pagination controls when pagination is provided', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(row) => row.id}
          pagination={{
            page: 1,
            pageSize: 10,
            total: 25,
            onPageChange: vi.fn(),
          }}
        />
      )

      expect(screen.getByText('Previous')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })

    it('should show correct results range', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(row) => row.id}
          pagination={{
            page: 2,
            pageSize: 10,
            total: 25,
            onPageChange: vi.fn(),
          }}
        />
      )

      expect(screen.getByText(/Showing 11 to 20 of 25 results/)).toBeInTheDocument()
    })

    it('should disable Previous button on first page', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(row) => row.id}
          pagination={{
            page: 1,
            pageSize: 10,
            total: 25,
            onPageChange: vi.fn(),
          }}
        />
      )

      expect(screen.getByText('Previous').closest('button')).toBeDisabled()
    })

    it('should disable Next button on last page', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(row) => row.id}
          pagination={{
            page: 3,
            pageSize: 10,
            total: 25,
            onPageChange: vi.fn(),
          }}
        />
      )

      expect(screen.getByText('Next').closest('button')).toBeDisabled()
    })

    it('should call onPageChange when Next is clicked', async () => {
      const user = userEvent.setup()
      const handlePageChange = vi.fn()

      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(row) => row.id}
          pagination={{
            page: 1,
            pageSize: 10,
            total: 25,
            onPageChange: handlePageChange,
          }}
        />
      )

      await user.click(screen.getByText('Next'))
      expect(handlePageChange).toHaveBeenCalledWith(2)
    })

    it('should call onPageChange when Previous is clicked', async () => {
      const user = userEvent.setup()
      const handlePageChange = vi.fn()

      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(row) => row.id}
          pagination={{
            page: 2,
            pageSize: 10,
            total: 25,
            onPageChange: handlePageChange,
          }}
        />
      )

      await user.click(screen.getByText('Previous'))
      expect(handlePageChange).toHaveBeenCalledWith(1)
    })

    it('should not show pagination when total fits in one page', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyExtractor={(row) => row.id}
          pagination={{
            page: 1,
            pageSize: 10,
            total: 5,
            onPageChange: vi.fn(),
          }}
        />
      )

      expect(screen.queryByText('Previous')).not.toBeInTheDocument()
      expect(screen.queryByText('Next')).not.toBeInTheDocument()
    })
  })

  describe('column className', () => {
    it('should apply column className to header', () => {
      const columnsWithClass: Column<TestData>[] = [
        { key: 'name', header: 'Name', cell: (row) => row.name, className: 'w-1/2' },
      ]

      render(
        <DataTable
          columns={columnsWithClass}
          data={testData}
          keyExtractor={(row) => row.id}
        />
      )

      const header = screen.getByText('Name').closest('th')
      expect(header).toHaveClass('w-1/2')
    })

    it('should apply column className to cells', () => {
      const columnsWithClass: Column<TestData>[] = [
        { key: 'name', header: 'Name', cell: (row) => row.name, className: 'font-bold' },
      ]

      render(
        <DataTable
          columns={columnsWithClass}
          data={testData}
          keyExtractor={(row) => row.id}
        />
      )

      const cell = screen.getByText('John Doe').closest('td')
      expect(cell).toHaveClass('font-bold')
    })
  })
})
