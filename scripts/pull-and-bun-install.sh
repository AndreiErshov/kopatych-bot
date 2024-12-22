#!/bin/bash
git pull && bun install && pm2 restart kopatych-bun && pm2 logs kopatych-bun
