FROM mongo:6

# Copy initialization scripts into the official init folder so they run on first start
COPY ./init /docker-entrypoint-initdb.d/

EXPOSE 27017

# Use the official entrypoint (image's default CMD). If you override, you must manage mongod startup.
CMD ["mongod"]