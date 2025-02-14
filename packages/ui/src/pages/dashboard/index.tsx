'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Cloud, MoreVertical, Plus, Server } from 'lucide-react'
import { useState } from 'react'

// Mock data for existing VMs
const mockVMs = [
  {
    id: 1,
    name: 'Web Server',
    provider: 'AWS',
    status: 'Running',
    ip: '192.168.1.1',
  },
  {
    id: 2,
    name: 'Database',
    provider: 'GCP',
    status: 'Stopped',
    ip: '10.0.0.1',
  },
  {
    id: 3,
    name: 'Load Balancer',
    provider: 'Azure',
    status: 'Running',
    ip: '172.16.0.1',
  },
]

export default function MulticloudDashboard() {
  const [vms, setVMs] = useState(mockVMs)
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    size: '',
    region: '',
  })

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    // Here you would typically make an API call to deploy the VM
    // For this example, we'll just add it to our local state
    const newVM = {
      id: vms.length + 1,
      name: formData.name,
      provider: formData.provider,
      status: 'Deploying',
      ip: 'Pending',
    }
    setVMs(prev => [...prev, newVM])
    // Reset form
    setFormData({ name: '', provider: '', size: '', region: '' })
  }

  return (
    <div className='flex flex-col min-h-screen'>
      <header className='flex items-center justify-between px-6 py-4 bg-background border-b'>
        <h1 className='text-2xl font-bold'>Multicloud Orchestrator</h1>
        <nav className='flex gap-4'>
          <Button variant='ghost'>Dashboard</Button>
          <Button variant='ghost'>VMs</Button>
          <Button variant='ghost'>Settings</Button>
        </nav>
      </header>
      <main className='flex-1 p-6 bg-muted/40'>
        <div className='max-w-4xl mx-auto space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Deploy New VM</CardTitle>
              <CardDescription>
                Configure and deploy a new virtual machine across cloud providers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>VM Name</Label>
                    <Input
                      id='name'
                      name='name'
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='provider'>Cloud Provider</Label>
                    <Select
                      name='provider'
                      value={formData.provider}
                      onValueChange={value => handleSelectChange('provider', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select provider' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='aws'>AWS</SelectItem>
                        <SelectItem value='gcp'>GCP</SelectItem>
                        <SelectItem value='azure'>Azure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='size'>VM Size</Label>
                    <Select
                      name='size'
                      value={formData.size}
                      onValueChange={value => handleSelectChange('size', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select size' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='small'>Small</SelectItem>
                        <SelectItem value='medium'>Medium</SelectItem>
                        <SelectItem value='large'>Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='region'>Region</Label>
                    <Select
                      name='region'
                      value={formData.region}
                      onValueChange={value => handleSelectChange('region', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select region' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='us-east'>US East</SelectItem>
                        <SelectItem value='us-west'>US West</SelectItem>
                        <SelectItem value='eu-central'>EU Central</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button type='submit' onClick={handleSubmit}>
                Deploy VM
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Existing VMs</CardTitle>
              <CardDescription>
                Manage your deployed virtual machines across all cloud providers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {vms.map(vm => (
                  <Card key={vm.id}>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>{vm.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' className='h-8 w-8 p-0'>
                            <span className='sr-only'>Open menu</span>
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem>Start</DropdownMenuItem>
                          <DropdownMenuItem>Stop</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                      <div className='flex items-center space-x-4 text-sm'>
                        <div className='flex items-center space-x-2'>
                          <Cloud className='h-4 w-4 text-muted-foreground' />
                          <span>{vm.provider}</span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Server className='h-4 w-4 text-muted-foreground' />
                          <span>{vm.status}</span>
                        </div>
                      </div>
                      <div className='mt-2 text-xs text-muted-foreground'>IP: {vm.ip}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
