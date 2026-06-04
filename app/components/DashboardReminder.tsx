'use client';

import { Bell, ArrowRight } from 'lucide-react';
import { Reminder, getReminders } from '@/infrastructure/storage/LocalStorageReminders';
import { useState, useEffect } from 'react';
import Link from 'next/link';