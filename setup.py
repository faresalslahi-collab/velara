from setuptools import setup

setup(
    name="velara",
    version="1.0.0",
    description="Hotel & Hospitality Management System",
    author="Arkan Lab",
    author_email="dev@arkan.tech",
    packages=["velara"],
    package_dir={"": "velara"},
    zip_safe=False,
    include_package_data=True,
    install_requires=["frappe"],
)
