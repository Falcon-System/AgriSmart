"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Edit, Warehouse, Loader2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ethiopianLocations from '@/data/ethiopian-locations.json'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { orpc, client } from "@/utils/orpc";

export default function FarmsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);

  const farmsQuery = useQuery(orpc.farms.list.queryOptions());
  const fieldsQuery = useQuery(orpc.fields.list.queryOptions());

  type Farm = Awaited<ReturnType<typeof client.farms.list.mutate>>[number];

  const farms: Farm[] = farmsQuery.data ?? [];
  const fields = fieldsQuery.data ?? [];

  const filteredFarms = farms.filter(
    (farm: Farm) =>
      farm.name?.toLowerCase().includes(search.toLowerCase()) ||
      farm.location?.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; areaHa: number; location: string }) => {
      console.log('Calling create mutation with data:', data); // Debug log
      try {
        const result = await (client.farms.create as any)(data);
        console.log('Create result:', result);
        return result;
      } catch (error) {
        console.error('Direct API call error:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log('Farm created successfully:', result); // Debug log
      queryClient.invalidateQueries({ queryKey: orpc.farms.list.queryKey() });
      toast.success("Farm created successfully!");
      form.reset(); // Clear the form
      setDrawerOpen(false);
    },
    onError: (error: any) => {
      console.error('Create farm error:', error); // Debug log
      console.error('Error details:', error?.response || error?.cause || error);
      toast.error(error.message || `Failed to create farm: ${error?.toString() || 'Unknown error'}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; areaHa: number; location: string }) => {
      console.log('Calling update mutation with data:', data); // Debug log
      try {
        const result = await (client.farms.update as any)(data);
        console.log('Update result:', result);
        return result;
      } catch (error) {
        console.error('Direct API call error:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log('Farm updated successfully:', result); // Debug log
      queryClient.invalidateQueries({ queryKey: orpc.farms.list.queryKey() });
      toast.success("Farm updated successfully!");
      form.reset(); // Clear the form
      setEditingFarm(null);
      setDrawerOpen(false);
    },
    onError: (error: any) => {
      console.error('Update farm error:', error); // Debug log
      console.error('Error details:', error?.response || error?.cause || error);
      toast.error(error.message || `Failed to update farm: ${error?.toString() || 'Unknown error'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Calling delete mutation with id:', id); // Debug log
      try {
        const result = await (client.farms.delete as any)({ id });
        console.log('Delete result:', result);
        return result;
      } catch (error) {
        console.error('Direct API call error:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log('Farm deleted successfully:', result); // Debug log
      queryClient.invalidateQueries({ queryKey: orpc.farms.list.queryKey() });
      toast.success("Farm deleted successfully!");
    },
    onError: (error: any) => {
      console.error('Delete farm error:', error); // Debug log
      console.error('Error details:', error?.response || error?.cause || error);
      toast.error(error.message || `Failed to delete farm: ${error?.toString() || 'Unknown error'}`);
    },
  });

  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestionKey, setSuggestionKey] = useState(0);

  const form = useForm({
    defaultValues: {
      name: editingFarm?.name ?? "",
      areaHa: editingFarm?.areaHa?.toString() ?? "",
    },
    validators: {
      onChange: ({ value }) => {
        const errors = [];
        if (!value.name.trim()) {
          errors.push("Farm name is required");
        }
        if (!value.areaHa || parseFloat(value.areaHa) <= 0) {
          errors.push("Area must be a positive number");
        }
        if (!city.trim() || !region.trim()) {
          errors.push("Location is required");
        }
        return errors.length > 0 ? errors : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      // Final validation
      if (!value.name.trim()) {
        toast.error("Farm name is required");
        return;
      }
      if (!city.trim() || !region.trim()) {
        toast.error("Location (city and region) is required");
        return;
      }
      if (!value.areaHa || parseFloat(value.areaHa) <= 0) {
        toast.error("Area must be a positive number");
        return;
      }

      const data = {
        name: value.name.trim(),
        areaHa: parseFloat(value.areaHa),
        location: `${city}, ${region}`,
      };

      console.log('Submitting farm data:', data); // Debug log
      
      if (editingFarm) {
        console.log('Updating farm with id:', editingFarm.id); // Debug log
        updateMutation.mutate({ id: editingFarm.id, ...data });
      } else {
        console.log('Creating new farm'); // Debug log
        createMutation.mutate(data);
      }
    },
  });

  const openCreate = () => {
    setEditingFarm(null);
    form.reset();
    setRegion("");
    setCity("");
    setDrawerOpen(true);
  };

  const openEdit = (farm: Farm) => {
    setEditingFarm(farm);
    form.setFieldValue("name", farm.name);
    form.setFieldValue("areaHa", farm.areaHa?.toString() ?? "");
    
    // Extract region and city from location string
    if (farm.location) {
      const [extractedCity, extractedRegion] = farm.location.split(', ').map((s: string) => s.trim());
      if (extractedRegion && ethiopianLocations.regions.some((r) => r.name === extractedRegion)) {
        setRegion(extractedRegion);
        setCity(extractedCity);
      }
    }
    
    setDrawerOpen(true);
  };

  const getFieldCount = (farmId: string) => {
    return fields.filter((f) => f.farmId === farmId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Farms</h1>
          <p className="text-muted-foreground">Manage your farm properties</p>
        </div>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Add Farm
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-md md:max-w-lg h-[90vh] max-h-[600px] overflow-hidden flex flex-col">
              <DrawerHeader>
                <DrawerTitle>
                  {editingFarm ? "Edit Farm" : "Add New Farm"}
                </DrawerTitle>
                <DrawerDescription>
                  {editingFarm
                    ? "Update farm information"
                    : "Register a new farm property"}
                </DrawerDescription>
              </DrawerHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
                className="p-4 space-y-4 flex-1 pb-20"
              >
                <form.Field name="name">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="name">Farm Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Gambella Farm"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="areaHa">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="areaHa">Total Area (hectares)</Label>
                      <Input
                        id="areaHa"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 10.5"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </form.Field>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <Input
                      id="location"
                      placeholder="Type location (e.g., Addis Ababa, Oromia...)"
                      value={city && region ? `${city}, ${region}` : (city || region || '')}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                                              
                        // Handle empty input
                        if (inputValue === '') {
                          setCity('');
                          setRegion('');
                          setHighlightedIndex(-1);
                          return;
                        }
                                              
                        // Parse the input to separate city and region
                        const parts = inputValue.split(',').map(p => p.trim());
                                              
                        if (parts.length === 1) {
                          // Only city or partial location typed - keep as user input
                          setCity(parts[0]);
                                                  
                          // Try to auto-select region if city matches exactly
                          let matchedRegion = null;
                          let matchedCity = null;
                                                  
                          for (const reg of ethiopianLocations.regions) {
                            const cityMatch = reg.cities.find(c => 
                              c.toLowerCase() === parts[0].toLowerCase()
                            );
                            if (cityMatch) {
                              matchedRegion = reg.name;
                              matchedCity = cityMatch;
                              break;
                            }
                          }
                                                  
                          // Auto-select if exact match found
                          if (matchedCity && matchedRegion) {
                            setRegion(matchedRegion);
                            setCity(matchedCity);
                          }
                        } else if (parts.length >= 2) {
                          // Both city and region possibly typed
                          const inputCity = parts[0];
                          const inputRegion = parts[1];
                                                  
                          setCity(inputCity);
                                                  
                          // Try to match region
                          const matchedRegion = ethiopianLocations.regions.find(r => 
                            r.name.toLowerCase().includes(inputRegion.toLowerCase())
                          );
                          if (matchedRegion) {
                            setRegion(matchedRegion.name);
                          }
                        }
                                              
                        // Reset highlighted index when text changes
                        setHighlightedIndex(-1);
                      }}
                      onKeyDown={(e) => {
                        // Handle backspace when input is empty or at start
                        if (e.key === 'Backspace' && e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0) {
                          // If at the beginning of the input, clear everything
                          if (city || region) {
                            e.preventDefault();
                            setCity('');
                            setRegion('');
                            setHighlightedIndex(-1);
                            return;
                          }
                        }
                        
                        // Handle delete when input is empty
                        if (e.key === 'Delete' && e.currentTarget.value === '' && (city || region)) {
                          e.preventDefault();
                          setCity('');
                          setRegion('');
                          setHighlightedIndex(-1);
                          return;
                        }
                        
                        // Handle keyboard navigation
                        const allSuggestions = [];
                        for (const reg of ethiopianLocations.regions) {
                          for (const cityOption of reg.cities) {
                            const fullLocation = `${cityOption}, ${reg.name}`;
                                                  
                            if (
                              city.toLowerCase() === '' || // Show all if input is empty
                              fullLocation.toLowerCase().includes(city.toLowerCase()) ||
                              cityOption.toLowerCase().includes(city.toLowerCase()) ||
                              reg.name.toLowerCase().includes(city.toLowerCase()) ||
                              // Partial matches for better suggestions
                              cityOption.toLowerCase().startsWith(city.toLowerCase()) ||
                              reg.name.toLowerCase().startsWith(city.toLowerCase())
                            ) {
                              allSuggestions.push({
                                display: fullLocation,
                                city: cityOption,
                                region: reg.name
                              });
                            }
                          }
                        }
                                              
                        switch (e.key) {
                          case 'ArrowDown':
                            e.preventDefault();
                            setHighlightedIndex(prev => 
                              prev < allSuggestions.length - 1 ? prev + 1 : 0
                            );
                            break;
                          case 'ArrowUp':
                            e.preventDefault();
                            setHighlightedIndex(prev => 
                              prev > 0 ? prev - 1 : allSuggestions.length - 1
                            );
                            break;
                          case 'Enter':
                            e.preventDefault();
                            if (highlightedIndex >= 0 && highlightedIndex < allSuggestions.length) {
                              const selected = allSuggestions[highlightedIndex];
                              setCity(selected.city);
                              setRegion(selected.region);
                              setSuggestionsVisible(false);
                              setHighlightedIndex(-1);
                            }
                            break;
                          case 'Escape':
                            setSuggestionsVisible(false);
                            setHighlightedIndex(-1);
                            break;
                        }
                      }}
                      onFocus={() => {
                        setSuggestionsVisible(true);
                        setHighlightedIndex(-1);
                        // Force re-render of suggestions to ensure they appear
                        setSuggestionKey(prev => prev + 1);
                      }}
                      onBlur={() => setTimeout(() => {
                        setSuggestionsVisible(false);
                        setHighlightedIndex(-1);
                      }, 200)}
                    />
                    {suggestionsVisible && (
                      <div key={suggestionKey} className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-auto">
                        {/* Suggestions based on combined location search */}
                        {(() => {
                          const allSuggestions = [];
                                              
                          // Find suggestions based on user input
                          for (const reg of ethiopianLocations.regions) {
                            for (const cityOption of reg.cities) {
                              const fullLocation = `${cityOption}, ${reg.name}`;
                                                  
                              // Include if matches the input (either city or region)
                              if (
                                city.toLowerCase() === '' || // Show all if input is empty
                                fullLocation.toLowerCase().includes(city.toLowerCase()) ||
                                cityOption.toLowerCase().includes(city.toLowerCase()) ||
                                reg.name.toLowerCase().includes(city.toLowerCase()) ||
                                // Partial matches for better suggestions
                                cityOption.toLowerCase().startsWith(city.toLowerCase()) ||
                                reg.name.toLowerCase().startsWith(city.toLowerCase())
                              ) {
                                allSuggestions.push({
                                  display: fullLocation,
                                  city: cityOption,
                                  region: reg.name
                                });
                              }
                            }
                          }
                                              
                          // Sort to prioritize exact matches and partial matches
                          return allSuggestions
                            .sort((a, b) => {
                              const cityLower = city.toLowerCase();
                              const aCityStart = a.city.toLowerCase().startsWith(cityLower);
                              const bCityStart = b.city.toLowerCase().startsWith(cityLower);
                              const aRegionStart = a.region.toLowerCase().startsWith(cityLower);
                              const bRegionStart = b.region.toLowerCase().startsWith(cityLower);
                              const aExactMatch = a.display.toLowerCase() === cityLower;
                              const bExactMatch = b.display.toLowerCase() === cityLower;
                                                  
                              // Prioritize exact matches
                              if (aExactMatch && !bExactMatch) return -1;
                              if (!aExactMatch && bExactMatch) return 1;
                                                  
                              // Prioritize items where city or region starts with input
                              if (aCityStart && !bCityStart) return -1;
                              if (!aCityStart && bCityStart) return 1;
                              if (aRegionStart && !bRegionStart) return -1;
                              if (!aRegionStart && bRegionStart) return 1;
                                                  
                              // Then prioritize shorter matches
                              return a.display.length - b.display.length;
                            })
                            .slice(0, 8) // Limit to 8 suggestions
                            .map((suggestion, index) => (
                              <div
                                key={index}
                                className={`px-4 py-2 cursor-pointer ${index === highlightedIndex ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                onMouseDown={() => {
                                  setCity(suggestion.city);
                                  setRegion(suggestion.region);
                                  setSuggestionsVisible(false);
                                  setHighlightedIndex(-1);
                                }}
                                // Also highlight on mouse enter for consistency
                                onMouseEnter={() => setHighlightedIndex(index)}
                              >
                                {suggestion.display}
                              </div>
                            ));
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <DrawerFooter className="px-0 mt-auto flex-shrink-0 sticky bottom-0 bg-background">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {editingFarm ? "Update Farm" : "Create Farm"}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search farms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {farmsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredFarms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Warehouse className="size-12 mx-auto mb-2 opacity-50" />
              <p>No farms found</p>
              <Button variant="link" onClick={openCreate} className="mt-2">
                Add your first farm
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Area (ha)</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFarms.map((farm) => (
                  <TableRow key={farm.id}>
                    <TableCell className="font-medium">{farm.name}</TableCell>
                    <TableCell>{farm.location || "-"}</TableCell>
                    <TableCell>{farm.areaHa}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getFieldCount(farm.id)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(farm)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(farm.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
