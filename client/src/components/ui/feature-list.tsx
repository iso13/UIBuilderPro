import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash, Copy, Edit, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Feature } from '@shared/schema';

interface FeatureListProps {
  features: Feature[];
  onDelete?: (id: number) => void;
  onCopy?: (id: number) => void;
  onEdit?: (id: number) => void;
  onView?: (id: number) => void;
}

export function FeatureList({ features, onDelete, onCopy, onEdit, onView }: FeatureListProps) {
  const navigate = useNavigate();

  const handleView = (id: number) => {
    if (onView) {
      onView(id);
    } else {
      navigate(`/features/${id}`);
    }
  };

  const handleEdit = (id: number) => {
    if (onEdit) {
      onEdit(id);
    } else {
      navigate(`/edit/${id}`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature) => (
        <Card key={feature.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="truncate text-xl">{feature.title}</CardTitle>
            <CardDescription className="text-sm text-gray-500">{feature.scenarioCount || 0} scenarios</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-gray-600 line-clamp-3">{feature.story}</p>
          </CardContent>
          <CardFooter className="flex justify-between pt-2 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleView(feature.id)}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {onEdit && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(feature.id)}
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {onCopy && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onCopy(feature.id)}
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(feature.id)}
                  title="Delete"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}